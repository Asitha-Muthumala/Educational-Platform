const express = require("express");
const router = express.Router();
const {
  getContents,
  getContent,
  addContent,
  updateContent,
  deleteContent,
  getEnrolledCourse,
} = require("../controllers/contentController");

router.route("/:course_id/content").get(getContents).post(addContent);
router.route("/:course_id/content/:content_id").get(getContent).put(updateContent).delete(deleteContent);


module.exports =router