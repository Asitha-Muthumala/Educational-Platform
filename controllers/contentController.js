const asyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary").v2;
const streamifier = require('streamifier');
const connection= require("../config/dbConnection");


// Get all content items for a specific course..

const getContents = asyncHandler(async (req, res) => {
  const courseId = req.params.course_id;
  connection.query("SELECT * FROM CourseContent WHERE course_id = ?",[courseId],async (err, data) => {
      if (err) {
        res.status(500).json({ status: false, message: "An error occurred while fetching contents." });
      } else {
        res.status(200).json({ status: true, data: data });
      }
    }
  );
});

// Get details of a specific content correspond to course id..

const getContent = asyncHandler(async (req, res) => {
  const contentId = req.params.content_id;
  const courseId = req.params.course_id;
  connection.query("SELECT * FROM CourseContent WHERE content_id = ? AND course_id=?",[contentId,courseId],async (err, data) => {
      if (err) {
        res.status(500).json({ status: false, message: "An error occurred while fetching content." });
      } else {
        if (data.length === 0) {
          res.status(404).json({ status: false, message: "Content not found." });
        } else {
          res.status(200).json({status: true, data: data[0]});
        }
      }
    }
  );
});

// Add new content to a course (for instructors).

const addContent = asyncHandler(async (req, res) => {
    const courseId = req.params.course_id;
    const { title, description, content_category,content_status } = req.body;
    const videoFile = req.file;
    console.log(videoFile)
    const course_id =req.params.course_id;

    if (!course_id || !description || !content_category  || !videoFile ||!content_status) {
      res.status(400).json({ status: false, message: "All fields are mandatory!." });
    } else {
      // Upload video to Cloudinary
      let uploadFromBuffer = (req) => {
        return new Promise((resolve, reject) => {
          let cld_upload_stream = cloudinary.uploader.upload_stream({folder: "course_video"},(error, result) => {
              if (result) {
                resolve(result);
                var contentUrl=result.url
                var publicId=result.public_id
                // Insert the content into the table.
                connection.query("INSERT INTO CourseContent (title, description,content_url,course_id,content_status,content_category, public_id) VALUES (?,?, ?,?, ?, ?,?)",
                    [title, description, contentUrl, courseId,content_status,content_category, publicId],
                    async (err,result) => {
                      if (err) {
                        cloudinary.uploader.destroy(publicId)
                        .then((result1) => {
                          if(result1.result=="ok"){
                            return res.status(500).json({ status: false, message: "An error occurred while adding content." });
                          }
                        })
                      } else {
                        return res.status(201).json({ status: true, message: "Content added successfully.1" });
                      }
                    });
              } else {
                reject(error);
              }
            });
          streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
        });
      };
      uploadFromBuffer(req).then(result => {
      }).catch(error => {
        console.error(error);
      });
    }
});

// Update content details (for instructors).

const updateContent = asyncHandler(async (req, res) => {
  const { title, description, content_status, content_category  } = req.body;
  const contentId = req.params.content_id;
  const courseId = req.params.course_id;
  const videoFile =req.file

  if (req.file){
    connection.query("SELECT * FROM CourseContent WHERE course_id = ? AND content_id=?", [courseId,contentId],  (err, data) => {
      const oldPublicId = data[0].public_id;
      const oldContentUrl = data[0].content_url;
      try {
        
        // Upload content to Cloudinary
        let uploadFromBuffer = (req) => {
          return new Promise((resolve, reject) => {
            let cld_upload_stream = cloudinary.uploader.upload_stream({folder: "course_video"}, (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              });
            streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
          });
        };
        uploadFromBuffer(req).then(result => {
          const newContentUrl=result.url;
          const newPublicId =result.public_id;
          connection.query("UPDATE CourseContent SET title = ?,description = ?,content_url = ?,content_category = ?,content_status =?, public_id=? WHERE  course_id = ? AND content_id=?",   
          [title, description, newContentUrl, content_category,content_status ,newPublicId,courseId,contentId],
              async (err, data) => {
                if (err) {
                  cloudinary.uploader.destroy(newPublicId)
                  .then((result1) => {
                    if(result1.result=="ok"){
                      res.status(200).json({ status: false, message: "Content updated fail." });
                    }
                  })
                } else {
                  if (data.affectedRows == 1) {
                    // destroy old content here
                    cloudinary.uploader.destroy(oldPublicId)
                    .then((result1) => {
                      if(result1.result=="ok"){
                        res.status(200).json({ status: true, message: "Content updated successfully." });
                      }
                    })
                  } else {
                    res.status(404).json({ status: false, message: "Content not found or no changes made.  -1" });
                  }
                }
              });
        }).catch(error => {
          console.error(error);
        });
      } catch (error) {

        res.status(500).json({ status: false, error: 'Error uploading content to Cloudinary' });
      } 
    })
  }else{
    connection.query("UPDATE CourseContent SET title = ?,description = ?,content_type = ?,content_status =? WHERE  course_id = ? AND content_id=?",   
    [title, description, content_type,content_status ,courseId,contentId],
      async (err) => {
        if (err) {
          res.status(500).json({ status: false, message: "An error occurred while updating the content." });
          
        } else {
          if (result.affectedRows == 1) {
            res.status(200).json({ status: true, message: "Content updated successfully." });
          } else {
            res.status(404).json({ status: false, message: "Content not found or no changes made." });
          }
        }
      });
    }
});

// Delete content from a course (for instructors).

const deleteContent = asyncHandler(async (req, res) => {
  const contentId = req.params.content_id;
  const courseId = req.params.course_id;
  connection.query("SELECT * FROM CourseContent WHERE content_id = ? AND course_id=?", [contentId,courseId],  (err, data) => {
    connection.query("DELETE FROM CourseContent WHERE content_id = ? AND course_id=?",[contentId,courseId],async (err, result) => {
      if (err) {
        res.status(500).json({ status: false, message: "An error occurred while deleting the course." });
      } else {
        if (result.affectedRows ==1) {
          const publicId = data[0].public_id;
          try {
            cloudinary.uploader.destroy(publicId)
            .then((result1) => {
              if(result1.result=="ok"){
                res.status(200).json({ status: true, message: "Content delete successfully." });
              }
            })
          } catch (error) {
            res.status(500).json({ status: false, error: 'Error uploading content to Cloudinary' });
          } 
        } else {
          res.status(404).json({ status: false, message: "Content not found." });
        }
      }
    }
  );
})
});

module.exports = {
  getContents,
  getContent,
  addContent,
  updateContent,
  deleteContent,
};
