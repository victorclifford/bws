const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  bundleCat: { type: Schema.Types.ObjectId, ref: "BundleCategory" },
  duration: { type: Number },
  status: { type: String },
  autoRenew: { type: Boolean }
},{
  collection: 'demo_subscriptions',
  versionKey: false
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
