const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number },
  ref: { type: String },
  status: { type: String },
  ip: { type: String },
  last4digits: { type: String },
  subscription: { type: String },
  tran_id: { type: String },
  payment_type: { type: String },
},{
  collection: 'demo_transactions',
  versionKey: false
});

module.exports = mongoose.model("Transactions", transactionSchema);
