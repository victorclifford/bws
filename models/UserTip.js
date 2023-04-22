const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const userTipSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  bundleCat: { type: Schema.Types.ObjectId, ref: "BundleCategory" },
  bundleID: { type: Schema.Types.ObjectId, ref: "Bundle" },
},{
  collection: 'demo_user_tips',
  versionKey: false
});

module.exports = mongoose.model("UserTip", userTipSchema);
