const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
    file_url: { type: String },
    cover_url: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    views: { type: Number, default: 0 },
    has_chapters: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Book", bookSchema);
