const axios = require('axios');

const { constants } = require('../utils/constants');

const stripe = require("stripe")(constants.STRIPE_SECRET_KEY);

exports.make_payment = (async (req, res) => {

    console.log("Hi");

    const { token, amount } = req.body;

    try {
        await stripe.charges.create({
            source: token.id,
            amount,
            currency: 'usd',
        });

        //call microservice: payment record management
        const result = await axios.post('http://localhost:5002/api/payment/createDBRecord', {
            "user_id": req.body.payment_data.user_id,
            "course_id": req.body.payment_data.course_id,
            "amount": req.body.payment_data.amount,
            "status": req.body.payment_data.status
        });

        if (result.data.status) {
            res.json({
                status: true,
                message: 'Payment and DB record created successfully'
            });
        } else {
            throw new Error('Failed to create DB record');
        }

    } catch (err) {
        res.json({
            status: false,
            message: 'failed'
        })
    }

});
