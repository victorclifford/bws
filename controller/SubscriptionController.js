const User = require("../models/User");
const Subscription = require("../models/Subscription");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const mjml2html = require("mjml");
const Handlebars = require("handlebars");
const sendEmail = require("../utils/emails");
const mongoose = require("mongoose");

function SubscriptionController(){
    const hasSubscription  = async (req, res) => {
        try {
            // Get user input
            const { id } = req.params;

            // check if user already exist
            // Validate if user exist in our database
            const subscription = await Subscription.findOne({user: mongoose.Types.ObjectId(id)});

            if (!subscription){
                return res.send({
                    status: 'error',
                    data: 'No subscription for selected user'
                })
            }

            // return the subscription found
            res.status(200).send({
                status: 'success',
                data: subscription
            });
        } catch (err) {
            console.log(err);
        }
    }

    return { hasSubscription, }
}

module.exports = SubscriptionController
