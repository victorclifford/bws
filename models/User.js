const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema({
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  loginToken: { type: String },
  level: { type: String},
  status: { type: String },
  phone: { type: String },
  emailVerifiedAt: { type: Date },
  verified: {type: Boolean, default: false }
},{
  collection: 'demo_users',
  versionKey: false
});

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("User", userSchema);
