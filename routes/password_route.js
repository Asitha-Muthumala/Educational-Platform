const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword } = require("../controllers/password_controller");
const { password_middleware } = require("../middleware/password_middleware");

router.use("/rp", password_middleware);

router.route("/fp").post(forgotPassword);
router.route("/rp").post(resetPassword);

module.exports = router;