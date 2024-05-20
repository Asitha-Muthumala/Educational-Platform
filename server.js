const express = require("express");
const multer = require("multer");
require("dotenv").config();
const app = express();
const multerObject = multer();


const cors = require("cors");
const Password_route = require('./routes/password_route');
const user_route = require('./routes/userRoutes');
const payment_route = require('./routes/payment_route');
const { constants } = require("./utils/constants");

app.use(express.json());
app.use(cors());
app.use("/api/users", require("./routes/userRoutes"));

// app.use("/api/users/:id", require("./routes/userRoutes"));
app.use("/api/courses",multerObject.single('thumbnail'), require("./routes/courseRoutes"));
app.use("/api/enrollments/", require("./routes/enrollmentRoutes"));
app.use("/api/course/",multerObject.single('videoFile'),  require("./routes/contentRoutes"));
app.use("/api/progress/",require("./routes/courseProgressRoutes"));

// app.use("/api/users", user_route);
// app.use("/api/users/:id", user_route);

app.use("/api", user_route)
app.use("/api/payment", payment_route)
app.use("/api/password", Password_route)
app.use("/api/resetPassword", Password_route)

const port = constants.PORT;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});