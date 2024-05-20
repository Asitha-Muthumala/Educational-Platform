const express = require("express");
const router = express.Router();
const { make_payment } = require("../controllers/payment_controller");

// const { authentication } = require("../middleware/authentication");

// router.use("/makePayment", authentication);

router.route("/makePayment").post(make_payment);

module.exports = router;