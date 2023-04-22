const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String },
  category: { type: String },
  body: { type: String },
  slug: { type: String },
  image: { type: String },
},{
  collection: 'demo_posts',
  versionKey: false
});

module.exports = mongoose.model("Post", postSchema);
