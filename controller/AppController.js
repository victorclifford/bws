const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const mjml2html = require("mjml");
const Handlebars = require("handlebars");
const sendEmail = require("../utils/emails");
const mongoose = require("mongoose");
const BundleCategory = require("../models/BundleCategory");
const Joi = require("joi");
const Bundle = require("../models/Bundle");
const Subscription = require("../models/Subscription");
const _ = require("lodash");
const {sendPushNotificationViaOneSignal} = require("../utils/pushNotification");
const Transaction = require("../models/Transaction");
const moment = require("moment");
const path = require("path");
const UserTip = require("../models/UserTip");
const {default: axios} = require("axios");
const momentT = require("moment-timezone");

function AppController(){
    const subscribeToNewsletter = async (req, res) => {
        try {
            const subscribingUser = {
                firstName: req.body?.firstName,
                lastName: req.body?.lastName,
                email: req.body?.email
            };

            const listId = "14529220af";

            const { data } = await axios.post(
                `https://us20.api.mailchimp.com/3.0/lists/${listId}/members/`,
                {
                    email_address: value.email,
                    status: "subscribed",
                    merge_fields: {
                        first_name: subscribingUser.firstName,
                        last_name: subscribingUser.lastName
                    }
                },
                {
                    headers: {
                        authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`
                    }
                }
            );

            // const { data } = await axios.post(
            //     "https://api.mailjet.com/v3/REST/contact",
            //     {
            //         IsExcludedFromCampaigns: false,
            //         name: value.fullName,
            //         email: value.email,
            //         ...(value.mobile && { mobile: value.mobile })
            //     },
            //     {
            //         auth: {
            //             username: $.env("MAILJET_API"),
            //             password: $.env("MAILJET_SECRET")
            //         }
            //     }
            // );

            console.log(data);

            return res.send({
                status: "success",
                msg: "Subscribed to newsletter successfully"
            });
        } catch (e) {
            console.dir(e, { depth: null });
            if (e.response && e.response.status === 400) {
                return res.send({
                    status: "success",
                    msg: "Already subscribed"
                });
            } else {
                return res.send({
                    status: 'error',
                    msg: e.toString()
                });
            }
        }
    }

    const contactForm = async (req, res) => {
        try {
            const source = fs.readFileSync("./storage/emails/contactus.mjml", "utf8");
            const htmlOutput = mjml2html(source);
            const template = Handlebars.compile(htmlOutput.html);
            const templateData = {
                fullName: req.body.fullName,
                email: req.body.email,
                message: req.body.message
            };

            // await sendMailViaSmtp({
            //     to: "info@betweysure.com",
            //     replyTo: value.email,
            //     from: "Betweysure <noreply@betweysure.com>",
            //     sender: "noreply@betweysure.com",
            //     subject: "New contact message",
            //     html: template(templateData)
            // });

            sendEmail("mudiinvents@gmail.com","","Betweysure","Betweysure <noreply@betweysure.com>",
                "New contact message", "", template(templateData))

            return res.send({
                status: "success",
                msg: "Message sent successfully!"
            });

        } catch (e) {
            return res.send({
                status: 'error',
                message: e.toString()
            });
        }
    }

    const betBundle = async(req, res) => {
        try {
            const id = req.params.id;
            const user = await User.findById(id);
            if (!user)
                return res.status(404).send({
                    status: "error",
                    msg: "User not found"
                });

            const subscription = await Subscription.findOne({
                user: id,
                status: "active"
            });

            if (!subscription)
                return res.status(401).send({
                    status: "error",
                    msg: "You currently don't have any active subscription or your subscription has expired!"
                });

            const yesterday = moment().subtract(1, "day").format("YYYY/MM/DD");
            const today = moment().format("YYYY/MM/DD");

            // let fixtures ;
            // if (!fs.existsSync($.path.storage(`/sports/${today}/fixtures.json`))) {
            //     fixtures = [];
            // } else {
            //     fixtures = fs.readFileSync(
            //         $.path.storage(`/sports/${today}/fixtures.json`),
            //         "utf8"
            //     );
            // }

            const yesterdayRawFixtures = JSON.parse(
                fs.readFileSync(`./storage/sports/${yesterday}/fixtures.json`).toString()
            );

            const todayRawFixtures = JSON.parse(
                fs.readFileSync(`./storage/sports/${today}/fixtures.json`).toString()
            );

            const fixtures = [...yesterdayRawFixtures, ...todayRawFixtures];

            const todayFixtures = fixtures.filter((el) => {
                return (
                    moment(today.replace(new RegExp("/", "g"), "-")).isSame(
                        momentT(new Date(el.time.date), "UTC").clone().tz("Africa/Lagos").format(),
                        "day"
                    ) &&
                    momentT(new Date(el.time.date), "UTC")
                        .clone()
                        .tz("Africa/Lagos")
                        .isAfter(today.replace(new RegExp("/", "g"), "-") + " 12:00:00") &&
                    momentT(new Date(el.time.date), "UTC")
                        .clone()
                        .tz("Africa/Lagos")
                        .isBefore(today.replace(new RegExp("/", "g"), "-") + " 23:00:00")
                );
            });

            const yesterdayFixtures = fixtures.filter(
                (el) =>
                    moment(yesterday.replace(new RegExp("/", "g"), "-")).isSame(
                        momentT(new Date(el.time.date), "UTC").clone().tz("Africa/Lagos").format(),
                        "day"
                    ) &&
                    momentT(new Date(el.time.date), "UTC")
                        .clone()
                        .tz("Africa/Lagos")
                        .isAfter(yesterday.replace(new RegExp("/", "g"), "-") + " 09:00:00") &&
                    momentT(new Date(el.time.date), "UTC")
                        .clone()
                        .tz("Africa/Lagos")
                        .isBefore(yesterday.replace(new RegExp("/", "g"), "-") + " 22:00:00")
            );

            const filteredFixtures = todayRawFixtures.sort((a, b) => {
                const checkA = a.predictions;
                const checkB = b.predictions;

                let sumOfA = 0;
                let sumOfB = 0;

                for (const probA of Object.values(checkA)) {
                    sumOfA += Number(probA);
                }

                for (const probB of Object.values(checkB)) {
                    sumOfB += Number(probB);
                }

                // return sumOfA < sumOfB ? 1 : -1;
                // return -1;
                return sumOfB - sumOfA;
            });


            const yesFilteredFixtures = yesterdayRawFixtures.sort((a, b) => {
                const checkA = a.predictions;
                const checkB = b.predictions;

                let sumOfA = 0;
                let sumOfB = 0;

                for (const probA of Object.values(checkA)) {
                    sumOfA += Number(probA);
                }

                for (const probB of Object.values(checkB)) {
                    sumOfB += Number(probB);
                }
                return sumOfB - sumOfA;
            });

            let data = {
                today: [],
                yesterday: []
            };
            const getBundle = await BundleCategory.findById(subscription.data.bundleCat);
            if (getBundle?.data.games === 3) {
                data.today = filteredFixtures.length >= 3 ? filteredFixtures.slice(0, 3) : [];
                data.yesterday =
                    yesFilteredFixtures.length >= 3 ? yesFilteredFixtures.slice(0, 3) : [];
            } else if (getBundle?.data.games === 5) {
                data.today = filteredFixtures.length >= 5 ? filteredFixtures.slice(0, 5) : [];
                data.yesterday =
                    yesFilteredFixtures.length >= 5 ? yesFilteredFixtures.slice(0, 5) : [];
            }

            return res.send({
                status: "success",
                data: data,
                bundle: getBundle?.data.games
            });
        } catch (e ) {
            return res.send({
                status: "error",
                message: e.toString()
            });
        }
    }

    const addPushNotification = async (req, res) => {
        try {
            const {token} = res.body;

            let currentTokens;
            currentTokens = fs.readFileSync(`./sports/tokens.json`);

            currentTokens = JSON.parse(currentTokens);

            if (currentTokens.includes(token)) {
                return res.send({
                    status: "success",
                    msg: "Token already exists"
                });
            }

            await fs.writeFile(
                `./sports/token.json`,
                JSON.stringify(currentTokens.push(token))
            );

            return res.send({
                status: "success",
                msg: "Token added"
            });
        } catch (e) {
            return res.send({
                status: 'error',
                msg: e.toString()
            });
        }
    }

    const sendPushNotification = async (req, res) => {
        try {
            const sendMsg = await sendPushNotificationViaOneSignal({
                message: req.body.message,
                url: req.body.url,
                heading: req.body.heading
            });

            if (sendMsg) {
                return res.send({
                    status: "success",
                    msg: "Message sent"
                });
            }

            return res.status(400).send({
                status: "error",
                msg: "Message not sent"
            });
        } catch (e) {
            return res.send({
                status: "error",
                msg: e.toString()
            });
        }
    }

    return { subscribeToNewsletter, contactForm, betBundle, addPushNotification, sendPushNotification }
}

module.exports = AppController;
