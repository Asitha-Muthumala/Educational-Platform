const express = require("express");
const router = express.Router();
const {
  createEnrollment,
  enrolledCourses,
  updateEnrollmentStatus,
  cancelEnrollment,
  getEnrolledCourse
} = require("../controllers/enrollmentController");


router.route("/:user_id/enrollments").get(enrolledCourses).post(createEnrollment);
router.route("/:user_id/enrollments/:enrollment_id").get(getEnrolledCourse);
router.route("/:enrollmentId").put(updateEnrollmentStatus).delete(cancelEnrollment);


module.exports =router