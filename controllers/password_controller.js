const { isEmpty } = require("../utils/object_isEmpty");
const { FORGOT_PASSWORD_MODEL, RESET_PASSWORD_MODEL } = require("../validation_models/userValidation");
const connection = require("../config/dbConnection");
const { constants } = require("../utils/constants");
const bcrypt = require("bcryptjs");
const JWT = require('jsonwebtoken');
const axios = require('axios');

const forgotPassword = (req, res) => {

    if (isEmpty(req.body)) {
        return res.json({
            status: false,
            message: "form data not found",
        })
    };

    try {
        const { error } = FORGOT_PASSWORD_MODEL.validate(req.body);
        
        if (error) {
            return res.json({
                status: false,
                message: "form data field error",
                error: error.details[0].message
            })
        }

        connection.query("SELECT * FROM user WHERE email = ?", [[req.body.email]], async (err, data, fields) => {

            if (err) {
                return res.json({
                    status: false,
                    message: "internal server error",
                    error: err
                })
            } else if (!data.length) {
                return res.json({
                    status: false,
                    message: "email not exist",
                })
            }

            const id = data[0].id;
            const token = JWT.sign({ id: data[0].id, fname: data[0].fname }, constants.FP_SECRET_KEY, { expiresIn: "5min" });

            const resetLink = `http://localhost:3000/reset-password?token=${token}?id=${id}`;

            const result = await axios.post('http://localhost:5001/api/send/mail', {
                "email": req.body.email,
                "subject": `Reset Password Link =  ${token}`,
                "content": `${resetLink}`
            });

            if(result.data.status) {
                return res.json({
                    status: true,
                    message: "Reset Password Link Send to the email",
                })
            }
            else {
                return res.json({
                    status: false,
                    message: "Something went wrong",
                })
            }
        });

    } catch (err) {
        return res.json({
            status: false,
            message: "internal server error",
            error: err
        })
    }

};

const resetPassword = async(req, res) => {
    if (isEmpty(req.body)) {
        return res.json({
            status: false,
            message: "form data not found",
        })
    };

    try {
        const { error } = RESET_PASSWORD_MODEL.validate(req.body);
        
        if (error) {
            return res.json({
                status: false,
                message: "form data field error",
                error: error.details[0].message
            })
        }

        if (req.body.newPassword != req.body.newConfirmPassword) {
            return res.json({
                status: false,
                message: "passwords are not match",
            })
        }

        const solt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(req.body.newPassword, solt);

        connection.query("UPDATE user SET password = ? WHERE id = ?;", [[hashedPassword], [req.body.id]], async (err, data, fields) => {

            if (err) {
                return res.json({
                    status: false,
                    message: "internal server error",
                    error: err
                })
            }

            return res.json({
                status: true,
                message: "Successfully reset password",
            })
            
        });

    } catch (err) {
        return res.json({
            status: false,
            message: "internal server error",
            error: err
        })
    }
};

module.exports = {
    forgotPassword,
    resetPassword
};
