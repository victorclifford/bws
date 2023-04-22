require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var cron = require("node-cron");

const User = require("./models/User");
const auth = require("./middleware/auth");
const fs = require("fs");
const mjml2html = require("mjml");
const Handlebars = require("handlebars");
const sendEmail = require("./utils/emails");
const { config } = require("dotenv");
const mongoose = require("mongoose");
const UserController = require("./controller/UserController")();
const AdminController = require("./controller/AdminController")();
const AppController = require("./controller/AppController")();
const BlogController = require("./controller/BlogController")();
const FootballController = require("./controller/FootballController")();
const FootballTasks = require("./tasks/Football")();
var cors = require("cors");
var bodyParser = require("body-parser");
const SubscriptionController = require("./controller/SubscriptionController")();

//-------------------
// const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
// const userRouter = UserController()

// const userRoute = require('./routes/userRoute');

app.use(express.json({ limit: "50mb" }));

// app.use("/api", userRoute)
// app.use("/api/auth", authRoutes);
app.get("/test", (req, res) => res.send("test route"));

app.route("/auth/register").post(UserController.register);

app.route("/auth/login").post(UserController.login);

app.get("/welcome", auth, (req, res) => {
  res.status(200).send(req.user);
});

app.route("/email/verify/:verifyToken").get(UserController.verifyUser);

app
  .route("/auth/email/verify/resend")
  .post(UserController.resendVerificationLink);

app.route("/email/forgotpassword").post(UserController.forgotPassword);

app.get("/email/reset/:resetToken", (req, res) => {
  let resetToken = req?.params?.resetToken;
  res.send("At verification page.");
});

app.route("/email/reset/:resetToken").post(UserController.resetPassword);

app.route("/bundles").get(AdminController.bundles);

app.route("/bundle-categories").get(AdminController.bundleCategories);

app.route("/create-bundle-category").post(AdminController.createBundleCategory);

app.route("/delete-bundle-category").post(AdminController.deleteBundleCategory);

app.route("/update-bundle-status").post(AdminController.updateBundleStatus);

app.route("/tips").get(AdminController.getTips);

app.route("/subscribers/:id").get(AdminController.getSubscribers);

app.route("/all-bundles").get(AdminController.getAllBundles);

app.route("/all-users/:page/:perPage/").get(AdminController.allUsers);

app.route("/user/:email").get(AdminController.selectUserByEmail);

app.route("/delete-user/:id").get(AdminController.deleteUser);

app.route("/subscribe-user").post(AdminController.subscribeUserToBundle);

app.route("/contact-us").post(AppController.contactForm);

app.route("/news-providers").get(BlogController.getNewsSources);

app.route("/crawl-news").get(BlogController.crawlNews);

app.route("/get-news").get(BlogController.getNews);

app.route("/get-full-news").get(BlogController.readCrawledNews);

app.route("/get-leagues").get(FootballController.getAllLeagues);

app.route("/get-league/:id").get(FootballController.getLeaguesById);

app.route("/get-league-by-team/:id").get(FootballController.leagueByTeamId);

app
  .route("/get-league-by-season/:season")
  .get(FootballController.leagueBySeason);

app.route("/get-all-fixtures").get(FootballController.getAllFixtures);

app.route("/get-current-round/:league").get(FootballController.getCurrentRound);

app
  .route("/get-current-fixtures/:league")
  .get(FootballController.currentFixtures);

app.route("/next-fixtures/:count").get(FootballController.nextFixtures);

app.route("/yesterday-fixtures").get(FootballController.yesterdayFixtures);

app.route("/today-fixtures").get(FootballController.todayFixtures);

app.route("/tomorrow-fixtures").get(FootballController.tomorrowFixtures);

app.route("/timezones").get(FootballController.timezones);

app.route("/today-odds").get(FootballController.todayOdds);

app.route("/tomorrow-odds").get(FootballController.tomorrowOdds);

app.route("/odds/:id").get(FootballController.oddsById);

app.route("/bookmakers").get(FootballController.bookmakers);

app.route("/predictions").get(FootballController.predictions);

app.route("/prediction/:fixtureId").get(FootballController.predictionById);

app.route("/has-subscription/:id").get(SubscriptionController.hasSubscription);

// app.post("/email/reset/:resetToken",async (req, res) => {
//   let resetToken = req?.params?.resetToken;
//   let decoded = Buffer.from(resetToken, 'base64').toString('utf8')
//   decoded = jwt.verify(decoded, process.env.JWT_SECRET);
//
//   try {
//     const filter = {
//       email: decoded?.email
//     }
//
//     const update = {
//       password: bcrypt.hashSync(req.body.password, 10),
//     }
//
//     console.log("Update: ", update)
//
//     let user = await User.findOneAndUpdate(filter, update)
//     let updatedUser = await  User.findOne(filter)
//
//     if (updatedUser){
//       console.log("User: ", updatedUser)
//       res.send(
//           {
//             status: "success",
//             msg: "Password reset successful."
//           }
//       )
//     }
//     else{
//       res.send(
//           {
//             status: "failed",
//             msg: "Password reset failed. Please try again."
//           }
//       )
//     }
//
//     // res.send(decoded?.email)
//   }
//   catch (err){
//     console.log("Error: ", err)
//   }
//
//   // let email = User.findOne({new Buffer.alloc(32, jwt.sign({ email }, process.env.JWT_SECRET)).toString('base64'): verifyToken})
// })

app.get("/logout", async (req, res) => {
  let filter = { email: req?.params?.email };
  let update = { loginToken: null };
  let user = await User.findOneAndUpdate(filter, update);

  if (user) {
    res.send({
      status: "success",
      msg: "Logged out successfully",
    });
  } else {
    res.send({
      status: "404 error",
      msg: "User not found",
    });
  }
});

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

async function fetchOrder() {
  await FootballTasks.fetchTodayOdds();
  await FootballTasks.fetchYesterdayOdds();
  FootballTasks.fetchTomorrowOdds();

  setTimeout(() => {
    FootballTasks.fetchPredictions();
  }, 70000);
}

cron.schedule("0 0 */2 * * *", () => {
  fetchOrder();
  console.log("running a task every two hours");
});
fetchOrder();

// FootballTasks.fetchTodayOdds();
// FootballTasks.fetchYesterdayOdds();

// FootballTasks.todayFixtures();
// FootballTasks.tomorrowFixtures();
// FootballTasks.yesterdayFixtures();
// FootballTasks.fetchTomorrowOdds();
// FootballTasks.fetchPredictions();
// FootballTasks.fetchBookmakers()

module.exports = app;
