const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const bundleSchema = new mongoose.Schema({
  category: { type: Schema.Types.ObjectId, ref: "BundleCategory" },
  status: { type: Boolean },
  title: { type: String },
  games: { type: Number },
  fee: { type: {} },
},{
  collection: 'demo_bundle_categories',
  versionKey: false
});

module.exports = mongoose.model("BundleCategory", bundleSchema);
