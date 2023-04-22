const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const bundleSchema = new mongoose.Schema({
  category: { type: Schema.Types.ObjectId, ref: "BundleCategory" },
  status: { type: String },
  tips: { type: [{}] },
},{
  collection: 'demo_bundles',
  versionKey: false
});

module.exports = mongoose.model("Bundle", bundleSchema);
