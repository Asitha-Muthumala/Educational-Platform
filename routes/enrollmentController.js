const asyncHandler = require("express-async-handler");
const Course = require("../models/courseModel");


// Get a list of all enrolled courses for the current user.

const enrolledCourses = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  connection.query(
    "SELECT * FROM enrolled_courses WHERE user_id = ?",[userId],async (err, data) => {
      if (err) {
        res.status(500).json({ message: "An error occurred while fetching enrolled courses." });
      } else {
        if (data.length === 0) {
          res.status(200).json({ message: "No enrolled courses found for the user." });
        } else {
          res.status(200).json(data);
        }
      }
    }
  );
});

// Enroll to the course.

const createEnrollment = asyncHandler(async (req, res, next) => {
  if (isEmpty(req.body)) {
      return next(new AppError("Form data not found.", 400));
  } else {
      const { user_id, course_id, enrollment_date, completion_status } = req.body;
      if (!user_id || !course_id || !enrollment_date || !completion_status) {
          return res.status(400).json({ message: "All fields are mandatory!" });
      } else {
          // Insert enrollment data directly into the database
          connection.query("INSERT INTO enrollments (user_id, course_id, enrollment_date, completion_status) VALUES (?, ?, ?, ?)",
          [user_id, course_id, enrollment_date, completion_status],(err, data) => {
              if (err) {
                res.status(500).json({ message: "An error occurred while enrolling courses." });
              } else {
                  return res.status(201).json({ message: "Enrollment created successfully." });
              }
          });
      }
  }
});

//  Update enrollment details

const updateEnrollmentStatus = asyncHandler(async (req, res) => {
    const { enrollment_id } = req.params; 
    const { completion_status } = req.body;

    try {
        // Update the status of the enrollment in the database
        connection.query(
            "UPDATE enrollments SET completion_status = ? WHERE enrollment_id = ?",
            [completion_status, enrollment_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({  message: "Failed to update enrollment status." });
                } else {
                    if (result.affectedRows === 1) {
                        
                        return res.status(200).json({ message: "Enrollment status updated successfully." });
                    } else {
                      return res.status(404).json({ message: "Enrollment not found." });
                    }
                }
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, error: "Sorry, something went wrong. Please try again later." });
    }
});



// Cancel enrollment in a course.

const cancelEnrollment = asyncHandler(async (req, res) => {
  const { enrollment_id } = req.params; 

  try {
      // Check if the enrollment exists
      connection.query("SELECT * FROM enrollments WHERE enrollment_id = ?",[enrollment_id],(err, result) => {
              if (err) {
                  return res.status(500).json({ message: "Failed to cancel enrollment." });
              } else {
                  if (result.length === 0) {
                      return res.status(404).json({ message: "Enrollment not found." });
                  } else {
                      // Cancel the enrollment by deleting it from the database
                      connection.query("DELETE FROM enrollments WHERE enrollment_id = ?",[enrollment_id],(err) => {
                              if (err) {
                                  return res.status(500).json({  message: "Failed to cancel enrollment." });
                              } else {
                                  return res.status(200).json({  message: "Enrollment canceled successfully." });
                              }
                          }
                      );
                  }
              }
          }
      );
  } catch (error) {
      res.status(500).json({ success: false, error: "Sorry, something went wrong. Please try again later." });
  }
});

module.exports = {
  enrollToCourse,
  enrolledCourses,
  updateEnrollment,
  cancelEnrollment,
};
