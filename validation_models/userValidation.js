const Joi = require('@hapi/joi');

exports.USER_MODEL = Joi.object({
    fname: Joi.string().min(3).max(50).required(),
    lname: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
    confirmPassword: Joi.string().min(8).max(100).required(),
    role: Joi.string().required()
})

exports.USER_LOGIN_MODEL = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

exports.FORGOT_PASSWORD_MODEL = Joi.object({
    email: Joi.string().email().required()
})

exports.RESET_PASSWORD_MODEL = Joi.object({
    id: Joi.required(),
    newPassword: Joi.string().min(8).max(100).required(),
    newConfirmPassword: Joi.string().min(8).max(100).required(),
})