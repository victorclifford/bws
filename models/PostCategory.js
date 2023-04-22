const mongoose = require("mongoose");

const postCategorySchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String },
},{
  collection: 'demo_post_categories',
  versionKey: false
});

module.exports = mongoose.model("PostCategory", postCategorySchema);
