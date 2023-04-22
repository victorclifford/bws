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

function AdminController(){
    const bundleCategories = async (req, res) => {
        try {
            const bundles = await BundleCategory.find({});

            return res.send({
                status: "success",
                msg: "Bundle categories fetched successfully",
                data: bundles
            });
        } catch (e) {
            return res.send({
                status: 'error',
                message: e
            });
        }
    }

    const bundles = async (req, res) => {
        try {
            const bundles = await Bundle.find({});

            return res.send({
                status: "success",
                msg: "Bundles fetched successfully",
                data: bundles
            });
        } catch (e) {
            return res.send({
                status: 'error',
                message: e
            });
        }
    }

    const updateBundleStatus = async (req, res) => {
        try {
            const id = req.body?.id
            const status = req.body?.status

            const filter = { _id: id }
            const update = { status: status }

            const bundle = await Bundle.findOneAndUpdate(filter, update);
            if (bundle) {
                res.send({
                    status: "success",
                    msg: "Bundle updated successfully"
                });
            }
            else{
                res.status(422).send({
                    status: "error",
                    msg: "Bundle not found!"
                });
            }
        } catch (e) {
            return res.send({
                status: 'error',
                message: e.toString()
            });
        }
    }

    const createBundleCategory = async (req, res) => {
        try {
            const { title, status, fee, games } = req.body;
            const checkIfExist = await BundleCategory.findOne({
                title: title
            });

            if (checkIfExist)
                return res.status(422).send({
                    status: "error",
                    msg: `Bundle category with ${title} already exists`
                });

            const category = await BundleCategory.create({
                title: title,
                status: status,
                fee: fee,
                games: games
            })

            if (category){
                return res.send({
                    status: "success",
                    msg: "Bundle Category Created",
                    data: category
                });
            }
            else{
                return res.send({
                    status: "error",
                    msg: "Creation failed",
                });
            }


        } catch (e) {
            return res.send({
                status: "error",
                msg: e.toString(),
            });
        }
    }

    const deleteBundleCategory = async (req, res) => {
        try {
            const {id} = req.body;

            const findBundleCategory = await BundleCategory.findOneAndDelete({ _id: id });

            if (findBundleCategory) {
                return res.send({
                    status: "success",
                    msg: "Bundle category deleted successfully"
                });
            }
            else {
                return res.status(404).send({
                    status: "error",
                    msg: "Bundle category not found"
                });
            }
        } catch (e) {
            return res.status(404).send({
                status: "error",
                msg: e.toString()
            });
        }
    }

    const addTips = async (req, res) => {
        try {
            const {tips, category} = req.body;

            const findBundle = await BundleCategory.findById(category);
            if (!findBundle)
                return res.status(422).send({
                    status: "error",
                    msg: "Bundle category not found"
                });

            if (findBundle.get("games") !== tips.length)
                return res.status(422).send({
                    status: "error",
                    msg: `Number of tips must be equal to ${findBundle.get("games")}`
                });

            const checkRunningGame = await Bundle.findOne({category: category, status: true});

            if (checkRunningGame) {
                return res.status(403).send({
                    status: "error",
                    msg: "previous bundle is still running, kindly disable and continue with creating a new one"
                });
            }

            const data = await Bundle.create({
                category: BundleCategory.id(category),
                tips
            });

            if (data){
                return res.status(201).send({
                    status: "success",
                    msg: "Tips added successfully",
                    data: data
                });
            }
            else {
                return res.status(422).send({
                    status: "error",
                    msg: "Failed to add Tips",
                });
            }


        } catch (e) {
            return  res.status(422).send({
                status: "error",
                msg: e.toString(),
            });
        }
    }

    const getTips = async (req, res) => {
        try {
            const categories = await BundleCategory.find({});

            if (categories) {
                for (const category of categories) {
                    const getBundles = await Bundle.find(
                        {category: category._id.toString()},
                        {
                            limit: 3,
                            sort: {createdAt: -1}
                        }
                    );

                    if (getBundles) {
                        category.bundles = getBundles;
                    }
                }

                return res.send({
                    status: "success",
                    data: categories
                });
            }

            return res.status(401).send({
                status: "error",
                msg: "No tip(s) found"
            });
        } catch (e) {
            return {
                status: "error",
                msg: e.toString()
            }
        }
    }

    const modifyTips = async (req, res) => {
        try {
            const {tips, bundleID} = req?.body;

            const findBundle = await Bundle.findById(bundleID);

            if (findBundle) {
                const cat = await BundleCategory.findById(findBundle.get("category"));

                if (cat) {
                    if (cat.get("games") !== tips.length)
                        return res.status(422).send({
                            status: "error",
                            msg: `Number of tips must be equal to ${cat.get("games")}`
                        });
                }

                await findBundle.updateOne({ tips: tips})

                return res.send({
                    status: "success",
                    msg: "Bundle updated successfully"
                });
            }

            return res.status(404).send({
                status: "error",
                msg: "Bundle not found"
            });
        } catch (e) {
            return {
                status: "error",
                msg: e.toString()
            };
        }
    }

    const getSubscribers = async (req, res) => {
        try {
            const id = req.params?.id;

            const findBundle = await BundleCategory.findById(id.toString());

            if (findBundle) {
                const fetchSubscribers = await Subscription.find({
                    bundleCat: id,
                    // status: "active"
                });

                if (fetchSubscribers) {
                    let users = [];

                    if (fetchSubscribers.length) {
                        for (const subscribers of fetchSubscribers) {
                            const getUserInfo = await User.findById(subscribers.user.toString());

                            if (getUserInfo) {
                                users.push(_.omit(getUserInfo, ["password"]));
                                console.log(getUserInfo)
                                // console.log("Pushed")
                            }
                        }
                        return res.send({
                            status: "success",
                            msg: "Subscribers fetched successfully",
                            data: users
                        });
                    }
                }

                return res.status(403).send({
                    status: "error",
                    msg: "Unable to fetch subscribers"
                });
            }

            return res.status(404).send({
                status: "error",
                msg: "Bundle not found"
            });
        } catch (e) {
            return res.send({
                status: "error",
                msg: e.toString()
            });
        }
    }

    const createNotification = async (req, res) => {
        try {
            await sendPushNotificationViaOneSignal({
                message: value.message,
                url: value.url,
                heading: value.title
            });

            // $.eServer.emit("notify-users", value);

            return res.status(201).send({
                status: "success",
                msg: "Notifications sent successfully"
            });
        } catch (e) {
            return res.send({
                status: "error",
                msg: e.toString()
            });
        }
    }

    const transactionChart = async (req, res) => {
        try {
            // const transactions = await Transaction.native().find({
            //     status: { $in: ["success", "successful"] }
            // });

            const transactions = await Transaction.count({
                status: {$in: ["success", "successful"]}
            });

            const data = [];

            // for (let step = 0; step < 12; step++) {
            //     const filterData = {} as { name; amount: number };
            //
            //     filterData.name =
            //         data[
            //             moment(transaction.createdAt).format("MMMM").toString().toLowerCase()
            //         ].push(transaction);
            // }

            return res.send({
                status: "success",
                data: data,
                transactions: transactions
            });
        } catch (e) {
            return res.send({
                status: "error",
                message: e.toString()
            });
        }
    }

    const getAllBundles = (req, res) => {
        try {
            const yesterday = moment().subtract(1, "day").format("YYYY/MM/DD");
            const today = moment().format("YYYY/MM/DD");

            let fixtures;
            if (!fs.existsSync(`../storage/sports/${today}/fixtures.json`)) {
                fixtures = fs.readFileSync(path.resolve(__dirname,`../storage/sports/${yesterday}/fixtures.json`));
            } else {
                fixtures = fs.readFileSync(path.resolve(__dirname,`../storage/sports/${today}/fixtures.json`));
                console.log('In the else')
            }
            fixtures = JSON.parse(fixtures);

            const todayFixtures = (
                fixtures.filter((el) =>
                    moment(today.replace(new RegExp("/", "g"), "-")).isSame(
                        moment(el.time.date),
                        "day"
                    )
                )
            );

            // console.log("Today's fixtures: ", todayFixtures)

            const filteredFixtures = todayFixtures.sort((a, b) => {
                const checkA = a.predictions;
                const checkB = b.predictions;

                console.log("Check A: ", checkA)
                console.log("Check B: ", checkB)

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

            console.log("Filtered fixtures: ", filteredFixtures)

            let data = filteredFixtures.slice(0, 5);

            return res.send({
                status: "success",
                data: data
            });
        } catch (e) {
            return res.send({
                status: "error",
                message: e.toString()
            });
        }
    }

    const allUsers = async (req, res) => {
        try {
            const page = req.params?.page;
            const perPage = req.params?.perPage;
            const q = req.query?.q;

            const options = {
                page: page,
                limit: perPage,
                sort: {createdAt: -1}
            }

            const query = {
                email: q
            }

            if (q && q.length) {
                const users = await User.paginate(query, options);

                if (users){
                    return res.send({
                        status: "success",
                        data: users
                    });
                }
                else{
                    return res.send({
                        status: "error",
                        message: "Fetching users with query failed"
                    });
                }
            } else {
                // Pagination of all posts
                const users = await User.paginate({}, options);

                if (users){
                    return res.send({
                        status: "success",
                        data: users
                    });
                }
                else{
                    res.send({
                        status: 'error',
                        message: 'Fetching users failed'
                    })
                }


            }
        } catch (e) {
            return res.send({
                status: 'error',
                message: e.toString()
            });
        }
    }

    const selectUserByEmail  = async (req, res) => {
        try {
            // Get user input
            const { email } = req.params;

            // check if user already exist
            // Validate if user exist in our database
            const user = await User.findOne({email: email});

            if (!user){
                return res.send({
                    status: 'error',
                    data: 'No subscription for selected user'
                })
            }

            // return the subscription found
            res.status(200).send({
                status: 'success',
                data: user
            });
        } catch (err) {
            console.log(err);
        }
    }

    const deleteUser = async (req, res) => {
        try {
            const userId = req.params?.id;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send({
                    status: "error",
                    msg: "User not found"
                });
            }
            console.log("UserID: ", userId)
            console.log("UserID: ", user._id)

            let fetchAllUserTips = await UserTip.find({user: userId });
            const fetchAllUserTransactions = await Transaction.find({user: userId.toString()});
            const fetchAllUserSubscriptions = await Subscription.find({user: userId.toString()});

            console.log("Fetch all user tips: ", fetchAllUserTips)
            console.log("Fetch all user Transactions: ", fetchAllUserTransactions)
            console.log("Fetch all user Subscriptions: ", fetchAllUserSubscriptions)
            // const fetchAllUserTips = await UserTip.fromQuery((native) =>
            //     native.find({user: userId.toString()})
            // );
            // const fetchAllUserTransactions = await Transaction.fromQuery((native) =>
            //     native.find({user: userId.toString()})
            // );
            // const fetchAllUserSubscriptions = await Subscription.fromQuery((native) =>
            //     native.find({user: userId.toString()})
            // );

            if (fetchAllUserTips.length > 0) {
                for (const tip of fetchAllUserTips) {
                    await UserTip.deleteOne({_id: tip._id});
                }
            }

            if (fetchAllUserTransactions.length > 0) {
                for (const transaction of fetchAllUserTransactions) {
                    await Transaction.deleteOne({_id: transaction._id});
                }
            }

            if (fetchAllUserSubscriptions.length > 0) {
                for (const subscription of fetchAllUserSubscriptions) {
                    await Subscription.deleteOne({_id: subscription._id});
                }
            }

            let deletedUser = await user.deleteOne({_id: userId});

            if (deletedUser){
                return res.send({
                    status: "success",
                    msg: "User deleted"
                });
            }
            else{
                return res.send({
                    status: "error",
                    msg: "User not deleted successfully"
                });
            }


        } catch (e) {
            return res.send({
                status: 'error',
                message: e.toString()
            });
        }
    }

    const subscribeUserToBundle = async (req, res) => {
        try {
            const id = req.body?.id;
            const bundleId = req.body?.bundleId;
            const duration = req.body?.duration;
            const startDate = req.body?.startDate;

            const user = await User.findById(id);
            if (!user)
                return res.status(404).send({
                    status: "error",
                    msg: "User not found"
                });

            const checkIfUserHasSubscription = await Subscription.findOne({
                user: id,
                status: "active"
            });

            // console.log("User subscription: ", checkIfUserHasSubscription)

            if (checkIfUserHasSubscription)
                return res.status(422).send({
                    status: "failed",
                    msg: "User already has an active subscription"
                });

            const bundleCategory = await BundleCategory.findById(bundleId);

            if (!bundleCategory){
                return res.status(404).send({
                    status: "error",
                    msg: "Bundle Category not found"
                });
            }

            const newSubscription = await Subscription.create({
                user: user._id,
                bundleCat: bundleCategory._id,
                duration: duration,
                startDate: new Date(startDate),
                expiredAt: new Date(
                    moment(startDate).add(duration, "days").toDate()
                ),
                updatedAt: moment(startDate).add(1, "hour").toDate(),
                status: "active"
            })


            if (newSubscription){
                const source = fs.readFileSync("./storage/emails/subscription.mjml", "utf8");
                const htmlOutput = mjml2html(source);
                const template = Handlebars.compile(htmlOutput.html);
                const templateData = {
                    firstName: user.get("firstName"),
                    title: `${bundleCategory?.data?.title} Subscription Successful`,
                    message: `You have successfully subscribed to ${bundleCategory?.data?.title} subscription.`
                };

                // await sendMailViaSmtp({
                //     to: user.get("email"),
                //     from: "Betweysure <noreply@betweysure.com>",
                //     sender: "noreply@betweysure.com",
                //     subject: "Subscription Successful",
                //     html: template(templateData)
                // });

                sendEmail(user.get("email"), "", "Betweysure", "Betweysure <noreply@betweysure.com>",
                    "Subscription Successful", "", template(templateData))

                return res.send({
                    status: "success",
                    msg: "User subscribed to bundle successfully"
                });
            }
            else{
                return res.send({
                    status: "error",
                    msg: "Could not subscribe user to bundle. Please try again."
                });
            }

        } catch (e) {
            return res.send({
                status: 'error',
                msg: e.toString()
            });
        }
    }

    return { bundles, bundleCategories, updateBundleStatus, createBundleCategory, deleteBundleCategory,
        addTips, getTips, modifyTips, getSubscribers, transactionChart, getAllBundles, allUsers, deleteUser,
    subscribeUserToBundle, selectUserByEmail }
}

module.exports = AdminController;
