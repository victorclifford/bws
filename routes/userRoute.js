const express = require('express');
const Route = express.Router();
const UsersController = require("../controllers/UsersController")
const {request} = require("express");

Route.route("/user/me")
    .get(UsersController.prototype.me(request))

//user related routes
// Route.route("user/", () => {
//     Route.get("=me");
//     Route.put("@claimBundle");
//     Route.get("@purchases");
//     Route.get("@transactions");
//     Route.patch("@updateProfilePhoto");
//     Route.patch("@updateProfile");
//     Route.get("@notifications");
//     Route.get("update-notification/:id", "notificationStatus");
//     Route.get("unread-notifications", "checkUnreadNotifications");
//     Route.delete("delete-notification/:id", "deleteNotification");
//     Route.get("notification/:id", "singleNotification");
//     Route.post("notification/push-device", "addPushDevice");
//     Route.post("auto-renew", "autoRenewal");
// })
//     .controller("UsersController")
//     .middleware("LoggedInMiddleware");

module.exports = Route;
