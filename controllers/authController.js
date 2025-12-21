const User = require("../models/user");
const PasswordReset = require("../models/PasswordReset"); // Import model mới
const nodemailer = require("nodemailer");

const forgotPassword = async(req, res) => {
    const { email } = req.body;
    try {
        // 1. Kiểm tra User có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email không tồn tại!" });
        }

        // 2. Tạo mã OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Xóa các yêu cầu cũ của email này (nếu có) để tránh rác
        await PasswordReset.deleteMany({ email });

        // 4. Lưu OTP vào Model mới
        const newReset = new PasswordReset({
            email,
            otp
        });
        await newReset.save();

        // 5. Gửi Email (Sử dụng Nodemailer)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "email_cua_ban@gmail.com",
                pass: "mat_khau_ung_dung_gmail",
            },
        });

        await transporter.sendMail({
            from: '"Ebook App" <no-reply@ebookapp.com>',
            to: email,
            subject: "Mã xác thực quên mật khẩu",
            text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`
        });

        res.status(200).json({ message: "Mã OTP đã được gửi thành công!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server nội bộ!" });
    }
};

module.exports = {
    // ... các hàm khác của bạn
    forgotPassword
};