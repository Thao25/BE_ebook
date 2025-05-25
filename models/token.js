const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  refreshToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1y" },
});

module.exports = mongoose.model("Token", tokenSchema);
