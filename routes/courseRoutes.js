const express = require("express");
const router = express.Router();

const {
  getCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  approveCourse,
  unApproveCourseList,
} = require("../controllers/courseController");

router.route("/unApprovalCourseList").get(unApproveCourseList);
router.route("/").get(getCourses).post(createCourse);
router.route("/update/:course_id").put(approveCourse);
router.route("courseID/:course_id").get(getCourse).put(updateCourse).delete(deleteCourse);

module.exports =router



