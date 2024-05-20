const asyncHandler = require("express-async-handler");
const connection= require("../config/dbConnection");

// Get a progress of the course.

const getProgress = asyncHandler(async (req, res) => {
  
  const enrollmentId = req.params.enrollment_id;

  connection.query(
    "SELECT COUNT(content_id ) FROM CourseContent WHERE  enrollment_id=?",[enrollmentId],async (err, data) => {
      if (err) {
        console.log(err)
        res.status(500).json({ status: false, message: "An error occurred while fetching progress of courses." });
      } else {
        if (data.affectedRows> 0) {
          connection.query(
            "SELECT COUNT(content_id ) FROM CourseProgress WHERE completion_status  = ? AND enrollment_id=?",[1,enrollmentId],async (err, result) => {
              if (err) {
                res.status(500).json({ status: false, message: "An error occurred while fetching completed  contents." });
              } else {
                if (result.affectedRows> 0) {
                  res.status(200).json({ status: true, progress:0 });
                } else {
                  res.status(200).json({ status: true, progress:(result.affectedRows/ data.affectedRows)*100});
                }
              }
            }
          );
        } else {
          res.status(500).json({ status: false, message: "There is no course correspond to the course id." });
        }
      }
    }
  );
});




module.exports = {
  getProgress
};
