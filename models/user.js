const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ["nam", "nu"] },
    dateOfBirth: Date,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    is_active: { type: Boolean, default: true },
    lockUntil: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);