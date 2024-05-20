const express = require("express");
const router = express.Router();
const {
  getProgress
} = require("../controllers/courseProgressController");

router.route("/enrollments/:enrollment_id").get(getProgress);

module.exports =router



