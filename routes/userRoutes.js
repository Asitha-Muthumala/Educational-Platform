const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser,
  testFunction,
} = require("../controllers/userController");

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/").get(getUser).put(updateUser).delete(deleteUser);
router.route("/auth").post(testFunction);


module.exports =router