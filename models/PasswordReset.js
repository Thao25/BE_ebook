const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 300 } // Tự động xóa sau 300 giây (5 phút)
});

// Khai báo Index để tìm kiếm nhanh theo email và otp
passwordResetSchema.index({ email: 1, otp: 1 });

module.exports = mongoose.model("PasswordReset", passwordResetSchema);