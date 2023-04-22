import express from "express";

const Route = express.Router();
const UsersController = require("../controllers/AdminController")
const {request} = require("express");

//Manage Users
Route.route("manageusers/", () => {
    Route.get("all-users/:perPage/:page", "allUsers");
    Route.delete("delete-user/:userId", "deleteUser");
    Route.patch("add-subscription", "subscribeUserToBundle");
})
    .controller("Admin")
    .middleware("Admin");

//Transactions
Route.path("transactions/", () => {
    Route.get("chart", "transactionChart");
})
    .controller("Admin")
    .middleware("Admin");

// Notification Admin Route
Route.path("notification/", () => {
    Route.post("create", "createNotification");
})
    .controller("Admin")
    .middleware("Admin");

//Category admin routes
Route.path("category/", () => {
    Route.post("create", "createCat");
    Route.delete("delete/:slug", "deleteCat");
    Route.put("update", "updateCat");
    Route.put("update", "updateCat");
})
    .controller("Blogs")
    .middleware("Admin");

//Posts admin routes
Route.path("post/", () => {
    Route.post("create", "createPost");
    Route.delete("delete/:slug", "deletePost");
    Route.put("update", "updatePost");
})
    .controller("Blogs")
    .middleware("Admin");

// Admin Routes
Route.path("admin/", () => {
    Route.get("bet-bundle", "getAllBetBundles");
    Route.post("auth/login", "login");
    Route.get("auth/logout", "logout");
}).controller("Admin");

//Bundle Routes - Admin
Route.path("bundle/", () => {
    Route.post("createCat", "createBundleCategory");
    Route.delete("delete/:id", "deleteBundleCat");
    Route.post("@addTips");
    Route.put("update", "modifyTips");
    Route.get("subscribers/:bundle", "getSubscribers");
    Route.get("=bundles");
    Route.get("tips", "getTips");
    Route.patch("update", "updateBundleStatus");
}).controller("Admin");
