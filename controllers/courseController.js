const asyncHandler = require("express-async-handler");
const connection= require("../config/dbConnection");
const {isEmpty} = require("../utils/object_isEmpty");
const cloudinary = require("cloudinary").v2;
const streamifier = require('streamifier');
    
cloudinary.config({ 
  cloud_name: 'damid8fr1', 
  api_key: '274236436577222', 
  api_secret: 'Xlj1LFVMKLBg0-dNlnXKUW7A5eA' 
});

// Get all courses

const getCourses = asyncHandler(async (req, res) => {
  connection.query("SELECT * FROM courses", (err, data) => {
    if (err) {
      res.status(500).json({
        status: false,
        message: "An error occurred while fetching courses." 
      });
    } else {
      res.status(200).json({
        status: true,
        data: data
      });
    }
  });
});

// Create New courses

const createCourse = asyncHandler(async (req, res, next) => {
  console.log("working creat")
  const { title, description, instructor_id, course_status, course_type ,enrollment_fee } = req.body;
  const thumbnail = req.file;
  console.log(req.body)
  if (!title || !description || !instructor_id || !enrollment_fee || !thumbnail || !course_status ||!course_type ) {
    
    return res.status(400).json({
      status: false,
      message: "All fields are mandatory!" 
    });
  } else {
    // Check whether course is already in the database.
    connection.query("SELECT * FROM courses WHERE title = ?", [title], async (err, data) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err 
        });
      } else if (data.length) {
        return res.status(400).json({
          status: false,
          message: "This course already exists." 
        });
      } else {
        try {
          // Upload thumbnail to Cloudinary
          let uploadFromBuffer = (req) => {
            return new Promise((resolve, reject) => {
              let cld_upload_stream = cloudinary.uploader.upload_stream({folder: "foo"},(error, result) => {
                  if (result) {
                    resolve(result);
                    var thumbnailUrl=result.url
                    var publicId=result.public_id
                    console.log("Course thumbnail upload successfully");

                    // Insert the course into the table.
                    connection.query("INSERT INTO courses (title, description,thumbnailUrl, instructor_id,course_status,course_type, enrollment_fee,public_id) VALUES (?,?, ?,?, ?, ?, ?, ?)",
                        [title, description, thumbnailUrl,instructor_id, course_status,course_type , enrollment_fee,publicId],
                        async (err) => {
                          if (err) {
                            return res.status(500).json({
                              status: false,
                              message: err
                            });
                          } else {
                            return res.status(201).json({
                              status: true,
                              message: "Course created successfully." 
                            });
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
            console.log(result);
          }).catch(error => {
            console.error(error);
          });

        } catch (error) {
          console.error(error);
          res.status(500).json({
            status: false,
            error: 'Error uploading image to Cloudinary'
          });
        } 
      }
    });
  }
});

// Get course

const getCourse = asyncHandler(async (req, res) => {
  console.log(req.params.course_id)
  const courseId = req.params.course_id;
  connection.query("SELECT * FROM courses WHERE course_id = ?", courseId, async (err, data) => {
    // Handle the result of the query
    console.log(data.length)
    if (err) {
      res.status(500).json({
        status: false,
        message: "An error occurred while fetching the course." 
      });
    } else if (data.length === 0) {
      res.status(400).json({
        status: false,
        error: "There is no course corresponding to the provided course ID-1." 
      });
    } else {
      res.status(200).json({
        status: true,
        data: data
      });
    }
  });
});

// Update courses

const updateCourse = asyncHandler(async (req, res,next) => {
const { title, description, course_status, course_type ,enrollment_fee } = req.body;
const courseId= req.params.course_id;

if (req.file){
  connection.query("SELECT * FROM courses WHERE course_id = ?", [courseId],  (err, data) => {
    console.log("1-111")
    const oldPublicId = data[0].public_id;
    const oldThumbnailUrl = data[0].thumbnailUrl;
    try {
      
      // Upload thumbnail to Cloudinary
      let uploadFromBuffer = (req) => {
        return new Promise((resolve, reject) => {
          let cld_upload_stream = cloudinary.uploader.upload_stream({folder: "foo"}, (error, result) => {
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
        const newThumbnailUrl=result.url;
        const newPublicId =result.public_id;
        connection.query("UPDATE Courses SET title = ?,description = ?,thumbnailUrl = ?,course_status = ?,course_type = ?,enrollment_fee =?, public_id=? WHERE course_id = ?",   
        [title, description, newThumbnailUrl, course_status,course_type , enrollment_fee,newPublicId,courseId],
            async (err, data) => {
              console.log("3333")
              if (err) {
                cloudinary.uploader.destroy(newPublicId)
                .then((result1) => {
                  if(result1.result=="ok"){
                    res.status(200).json({
                      status: false,
                      message: "Course updated fail." 
                    });
                  }
                })
              } else {
                console.log(data.affectedRows ,"effected row")
                if (data.affectedRows == 1) {
                  // destroy old image here
                  cloudinary.uploader.destroy(oldPublicId)
                  .then((result1) => {
                    if(result1.result=="ok"){
                      res.status(200).json({ 
                        status: true,
                        message: "Course updated successfully." 
                      });
                    }
                  })
                } else {
                  res.status(404).json({
                    status: false,
                    message: "Course not found or no changes made.  -1" 
                  });
                }
              }
            });
      }).catch(error => {
        console.error(error);
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        status: false,
        error: 'Error uploading image to Cloudinary' 
      });
    } 
  })
}else{
  connection.query("UPDATE Courses SET title = ?,description = ?,course_status = ?,course_type = ?,enrollment_fee = ? WHERE course_id = ?",   
  [title, description, course_status,course_type , enrollment_fee,courseId],
    async (err) => {
      if (err) {
        res.status(500).json({ 
          status: false,
          message: "An error occurred while updating the course." 
        });
         
      } else {
        if (result.affectedRows == 1) {
          res.status(200).json({
            status: true,
            message: "Course updated successfully." 
          });
        } else {
          res.status(404).json({ 
            status: false,
            message: "Course not found or no changes made." 
          });
        }
      }
    });
  }
});

// Delete courses

const deleteCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.course_id;
  connection.query("SELECT * FROM courses WHERE course_id = ?", [courseId],  (err, data) => {
    connection.query("DELETE FROM courses WHERE course_id = ?",[courseId],async (err, result) => {
      if (err) {
        res.status(500).json({ status: false, message: "An error occurred while deleting the course." });
      } else {
        if (result.affectedRows ==1) {
          const publicId = data[0].public_id;
          try {
            cloudinary.uploader.destroy(publicId)
            .then((result1) => {
              if(result1.result=="ok"){
                res.status(200).json({ status: true, message: "Course delete successfully." });
              }
            })
          } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, error: 'Error uploading image to Cloudinary' });
          } 
        } else {
          res.status(404).json({ status: false, message: "Course not found." });
        }
      }
    }
  );
  }) 
});
const approveCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.course_id;
    connection.query("UPDATE Courses SET course_status = ? WHERE course_id=?", [1,courseId],async (err, result) => {
      if (err) {
        res.status(500).json({ status: false, message: "An error occurred while approving the course." });
      } else {
        if (result.affectedRows ==1) {
          res.status(200).json({ status: true, message: "Course approved successfully." });
        } else {
          res.status(404).json({ status: false, message: "course not approve." });
        }
      }
    }
  );
});

const unApproveCourseList = asyncHandler(async (req, res) => {
    connection.query("SELECT * FROM Courses WHERE course_status =?", [0],async (err, result) => {
      if (err) {
        res.json({ 
          status:false,
          message: "An error occurred while getting unapproval the course." });
      } else {
          res.json({
            status:true,
            data:result
          });
        
      }
    }
  );
});

module.exports = {
  getCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  approveCourse,
  unApproveCourseList
};
