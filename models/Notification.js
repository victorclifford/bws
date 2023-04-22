const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  message: { type: String },
  title: { type: String },
  read: { type: Boolean }
},{
  collection: 'demo_notifications',
  versionKey: false
});

module.exports = mongoose.model("Notification", subscriptionSchema);
