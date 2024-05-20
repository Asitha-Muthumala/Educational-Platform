const JWT = require('jsonwebtoken');
const { constants } = require("../utils/constants");

const authentication = (req, res, next) => {

    const token = req.headers['authorization'].slice(7);

    if (!token) {
        return res.json({
            status: false,
            message: "Access Denied"
        })
    }

    try {

        const verified = JWT.verify(token, constants.SECRET_KEY);

        next();

    }
    catch (err) {
        res.json({
            status: false,
            message: "Access Denied"
        })
    }

}

module.exports = {
    authentication
};