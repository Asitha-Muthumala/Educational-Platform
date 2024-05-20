const asyncHandler = require("express-async-handler");
const connection= require("../config/dbConnection");

// Get a list of all enrolled courses for the current user.

const enrolledCourses = asyncHandler(async (req, res) => {
  const userId = req.params.user_id;
  console.log(userId)

  connection.query(
    "SELECT * FROM Enrollments WHERE user_id = ?",[userId],async (err, data) => {
      if (err) {
        res.status(500).json({ status: false, message: "An error occurred while fetching enrolled courses." });
      } else {
        if (data.length === 0) {
          res.status(400).json({ status: false, message: "No enrolled courses found for the user." });
        } else {
          res.status(200).json({
            status: true,
            data: data
          });
        }
      }
    }
  );
});


// Get a one enrolled course for the current user.

const getEnrolledCourse = asyncHandler(async (req, res) => {
  const userId = req.params.user_id;
  const enrollmentId = req.params.enrollment_id;
  connection.query(
    "SELECT * FROM Enrollments WHERE user_id = ? AND enrollment_id=?",[userId,enrollmentId],async (err, data) => {
      if (err) {
        res.status(500).json({ status: false, message: "An error occurred while fetching a enrolled course." });
      } else {
        if (data.length === 0) {
          res.status(400).json({ status: false, message: "No enrolled course found for the user." });
        } else {
          res.status(200).json({
            status: true,
            data: data
          });
        }
      }
    }
  );
});

// Enroll to the course.

const createEnrollment = asyncHandler(async (req, res, next) => {
  console.log("createEnrollment")
  const user_id = req.params.user_id;
      const {course_id, enrollment_date, completion_status } = req.body;
      // completion state initialy =0
      if (!user_id || !course_id || !enrollment_date ) {
          return res.status(400).json({ status: false, message: "All fields are mandatory!" });
      } else {
          // Insert enrollment data  into the database
          connection.query("INSERT INTO Enrollments (user_id, course_id, enrollment_date, completion_status) VALUES (?, ?, ?, ?)",
          [user_id, course_id, enrollment_date, completion_status],(err, data) => {
              if (err) {
                res.status(500).json({ status: false, message: "An error occurred while enrolling courses." });
              } else {
                  return res.status(201).json({ status: true, message: "Enrollment created successfully." });
              }
          });
      }
});

//  Update enrollment details

const updateEnrollmentStatus = asyncHandler(async (req, res) => {
    const enrollment_id = req.params.enrollmentId; 
    const status = req.body.status;    

    try {
        // Update the status of the enrollment in the database
        connection.query(
            "UPDATE enrollments SET completion_status = ? WHERE enrollment_id = ?",
            [status, enrollment_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ status: false, message: "Failed to update enrollment status." });
                } else {
                    if (result.affectedRows === 1) {
                        
                        return res.status(200).json({ status: true, message: "Enrollment status updated successfully." });
                    } else {
                      return res.status(404).json({ status: false, message: "Enrollment not found." });
                    }
                }
            }
        );
    } catch (error) {
        res.status(500).json({ status: false, error: "Sorry, something went wrong. Please try again later." });
    }
});



// Cancel enrollment in a course.

const cancelEnrollment = asyncHandler(async (req, res) => {
  const { enrollment_id } = req.params; 

  try {
      // Check if the enrollment exists
      connection.query("SELECT * FROM enrollments WHERE enrollment_id = ?",[enrollment_id],(err, result) => {
              if (err) {
                  return res.status(500).json({ status: false, message: "Failed to cancel enrollment." });
              } else {
                  if (result.length === 0) {
                      return res.status(404).json({ status: false, message: "Enrollment not found." });
                  } else {
                      // Cancel the enrollment by deleting it from the database
                      connection.query("DELETE FROM enrollments WHERE enrollment_id = ?",[enrollment_id],(err) => {
                              if (err) {
                                  return res.status(500).json({  status: false, message: "Failed to cancel enrollment." });
                              } else {
                                  return res.status(200).json({ status: true, message: "Enrollment canceled successfully." });
                              }
                          }
                      );
                  }
              }
          }
      );
  } catch (error) {
      res.status(500).json({ status: false, error: "Sorry, something went wrong. Please try again later." });
  }
});

module.exports = {
  createEnrollment,
  enrolledCourses,
  updateEnrollmentStatus,
  cancelEnrollment,
  getEnrolledCourse,
};
