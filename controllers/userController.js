const asyncHandler = require("express-async-handler");
const { isEmpty } = require("../utils/object_isEmpty");
const { USER_MODEL, USER_LOGIN_MODEL } = require("../validation_models/userValidation");
const connection = require("../config/dbConnection");
const { constants } = require("../utils/constants");
const bcrypt = require("bcryptjs");
const JWT = require('jsonwebtoken');
const axios = require('axios');

const loginUser = asyncHandler(async (req, res, next) => {
    //check request body is empty
    if (isEmpty(req.body)) {
        return res.json({
            status: false,
            message: "request data not found",
        })
    };

    try {
        const { error } = USER_LOGIN_MODEL.validate(req.body);
        
        if (error) {
            return res.json({
                status: false,
                message: "login form data field error",
                error: error.details[0].message
            })
        }

        connection.query("SELECT * FROM users WHERE email = ?", [[req.body.email]], async (err, data, fields) => {
            
            if (err) {
                return res.json({
                    status: false,
                    message: "internal server error",
                    error: err
                })
            } else if (!data.length) {
                return res.json({
                    status: false,
                    message: "user not exist",
                })
            }

            const isMatch = await bcrypt.compare(req.body.password, data[0].password);

            if (!isMatch) {
                return res.json({
                    status: false,
                    message: "wrong password",
                })
            }

            const token = JWT.sign({ id: data[0].id, fname: data[0].name, role: data[0].role }, constants.SECRET_KEY, { expiresIn: "10min" });

            res.json({
                status: true,
                message: "login successful",
                token: token,
                role: data[0].role,
                first_name: data[0].fname
            });
        })

    } catch (err) {
        return res.json({
            status: false,
            message: "internal server error",
            error: err
        })
    }
});

const registerUser = asyncHandler(async (req, res, next) => {
    //check request body is empty
    if (isEmpty(req.body)) {
        return res.json({
            status: false,
            message: "request data not found",
        })
    };

    try {

        const { error } = USER_MODEL.validate(req.body);

        if (error) {
            return res.json({
                status: false,
                message: "register form data field error",
                error: error.details[0].message
            })
        }

        connection.query("SELECT * FROM users WHERE email = ?", [[req.body.email]], async (err, data, fields) => {
            if (err) {
                return res.json({
                    status: false,
                    message: "internal server error",
                    error: err
                })
            };

            if (data.length) {
                return res.json({
                    status: false,
                    message: "user already exist",
                })
            }

            if (req.body.password != req.body.confirmPassword) {
                return res.json({
                    status: false,
                    message: "passwords are not match",
                })
            }

            if (req.body.role != "student" && req.body.role != "instructor") {
                return res.json({
                    status: false,
                    message: "invalid user role",
                })
            }

            const solt = await bcrypt.genSalt(10);

            const hashedPassword = await bcrypt.hash(req.body.password, solt);

            connection.query("INSERT INTO users VALUES(Null, ?)", [[req.body.fname, req.body.lname, req.body.email, hashedPassword, req.body.role]], async(err, data, fields) => {
                if (err) {
                    return res.json({
                        status: false,
                        message: "internal server error",
                        error: err
                    })
                };

                //call microservice: email service -> send customize email
                await axios.post('http://localhost:5001/api/send/mail', {
                    "email": req.body.email,
                    "subject": "User Registration",
                    "content": `This user email ${req.body.email} is successfully registered to the system`
                });

                res.json({
                    status: true,
                    message: "successfully registered user",
                })
            })
        })
    }
    catch (err) {
        return res.json({
            status: false,
            message: "internal server error",
            error: err
        })
    }
});

//Get current user's profile information.

const getUser = asyncHandler(async (req, res) => {
    const userId = req.params.user_id; 

    connection.query("SELECT * FROM Users WHERE user_id = ?", [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                status: false,
                error: 'Internal Server Error' 
            });
        }
        if (results.length === 0) {
            return res.status(404).json({ 
                status: false,
                message: 'User not found'
            });
        }
        const user = results[0]; 
        return res.status(200).json({
            status: true,
            user: user
        });
    });
});


// Update current user's profile.

const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params.user_id; 
    const { first_name, last_name, email } = req.body; 
    const sql = "UPDATE Users SET first_name = ?, last_name = ?, email = ?, password_hash = ? WHERE user_id = ?";
    const values = [first_name, last_name, email, userId];

    connection.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({
                status: false,
                error: 'Internal Server Error'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: false,
                message: 'User not found' 
            });
        }
        return res.status(200).json({
            status: true,
            message: 'User updated successfully' 
        });
    });
});

// Delete current user's account.

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params.user_id;
    connection.query("DELETE FROM Users WHERE user_id = ?", [userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                status: false, 
                error: 'Internal Server Error' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: false,
                message: 'User not found' 
            });
        }
        return res.status(200).json({
            status: true,
            message: 'User deleted successfully' 
        });
    });
});

//testing purpose
const testFunction = (req, res) => {
    res.json({
        message: "success verify"
    })
};

module.exports = {
    registerUser,
    loginUser,
    getUser,
    updateUser,
    deleteUser,
    testFunction,
};
