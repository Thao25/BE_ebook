const User = require("../models/user");
const Token = require("../models/token");
const bcrypt = require("bcrypt");
const AppError = require("../utils/error");
const { hashPassword, comparePassword } = require("../utils/password");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} = require("../utils/jwt");

const registerUser = async({ name, email, password, role }) => {
    if (!name || !email || !password) {
        throw new AppError(400, "Vui lòng cung cấp đầy đủ thông tin.");
    }

    const existing = await User.findOne({ email });
    if (existing) {
        throw new AppError(400, "Email đã tồn tại.");
    }

    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed, role });

    return {
        message: "Đăng ký thành công",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

const loginUser = async({ email, password }, recordFailedAttempt, clearFailedAttempts) => {
    if (!email || !password) {
        throw new AppError(400, "Email và mật khẩu là bắt buộc.");
    }

    // Generic error message to prevent user enumeration
    const genericError = new AppError(
        400,
        "Email hoặc mật khẩu không đúng."
    );

    const user = await User.findOne({ email });
    if (!user) {
        if (recordFailedAttempt) recordFailedAttempt();
        throw genericError;
    }

    if (!user.is_active) {
        if (recordFailedAttempt) recordFailedAttempt();
        throw new AppError(
            403,
            "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên."
        );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        if (recordFailedAttempt) recordFailedAttempt();
        throw genericError;
    }

    // Clear failed attempts on successful login
    if (clearFailedAttempts) clearFailedAttempts();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await Token.findOneAndUpdate({ user: user._id }, { refreshToken }, { upsert: true, new: true });

    return {
        message: "Đăng nhập thành công",
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

const refreshAccessToken = async(refreshToken) => {
    if (!refreshToken) {
        throw new AppError(400, "Thiếu refreshToken");
    }

    const decoded = verifyRefreshToken(refreshToken);
    const savedToken = await Token.findOne({ user: decoded.id, refreshToken });
    if (!savedToken) {
        throw new AppError(400, "RefreshToken không hợp lệ");
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        throw new AppError(404, "Không tìm thấy người dùng");
    }

    return { accessToken: signAccessToken(user) };
};

const getAllUsers = async() => {
    const users = await User.find().select("-password");
    return { message: "success", data: users };
};

const getUserById = async(id) => {
    const user = await User.findById(id).select("-password");
    if (!user) {
        throw new AppError(404, "Không tìm thấy người dùng");
    }
    return { message: "success", data: user };
};

const toggleUserStatus = async(id, io) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(400, "Không tìm thấy người dùng");
    }

    user.is_active = !user.is_active;
    await user.save();

    if (io) {
        io.emit("user-status-changed", {
            userId: user._id.toString(),
            is_active: user.is_active,
        });
    }

    return {
        message: "Đã cập nhật trạng thái người dùng",
        is_active: user.is_active,
    };
};

const updateProfile = async(userId, payload, file) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(400, "Không tìm thấy người dùng");
    }

    if (file && file.filename) {
        user.avatar = `/uploads/avatars/${file.filename}`;
    }

    const { name, avatar, phone, gender, dateOfBirth } = payload;
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();

    return {
        message: "Đã cập nhật thông tin cá nhân",
        data: {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
        },
    };
};

const changePassword = async(userId, { oldPassword, newPassword }) => {
    if (!oldPassword || !newPassword) {
        throw new AppError(
            400,
            "Vui lòng cung cấp đầy đủ mật khẩu cũ và mới."
        );
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(404, "Không tìm thấy người dùng");
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
        throw new AppError(400, "Mật khẩu cũ không đúng");
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return { message: "Đổi mật khẩu thành công" };
};


const PasswordReset = require("../models/PasswordReset"); // Module mới bạn đã tạo
const nodemailer = require("nodemailer");

const forgotPassword = async({ email }) => {
    // 1. Kiểm tra đầu vào (Khớp với Login/Register của bạn)
    if (!email) {
        throw new AppError(400, "Vui lòng cung cấp email.");
    }

    // 2. Tìm User trong Database (Dùng Model User có sẵn của bạn)
    const user = await User.findOne({ email });
    if (!user) {
        // Trả về 404 để khớp với code Android: if (response.code() == 404)
        throw new AppError(404, "Email không tồn tại trên hệ thống.");
    }
    if (user.lockUntil && user.lockUntil > Date.now()) {
        const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw new AppError(403, `Tài khoản đang bị khóa do nhập sai nhiều lần. Thử lại sau ${timeLeft} phút.`);
    }

    // 3. Tạo mã OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 4. Lưu vào bảng PasswordReset
    await PasswordReset.deleteMany({ email: email.trim() });
    await PasswordReset.create({
        email: email.trim(),
        otp: hashedOtp,
        attempts: 0
    });

    // 5. Logic gửi mail (Có thể dùng App Password của Gmail)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "kma2025ebook@gmail.com",
            pass: "eaqpewlugxloemlh",
        },
    });

    try {
        await transporter.sendMail({
            from: '"Ebook App" <no-reply@ebook.com>',
            to: email,
            subject: "Mã OTP quên mật khẩu",
            text: `Mã xác thực của bạn là: ${otp}. Hiệu lực trong 5 phút.`
        });
    } catch (mailError) {
        console.log("Lỗi gửi mail nhưng vẫn tiếp tục để test: ", mailError);
    }

    // Log ra console để bạn lấy mã này nhập vào Android/Postman mà không cần mở email
    console.log(`>>> OTP cho ${email} là: ${otp}`);

    return { message: "Mã OTP đã được gửi." };
};

// Hàm xác thực OTP
const verifyOTP = async({ email, otp }) => {
    if (!email || !otp) throw new AppError(400, "Thiếu email hoặc mã OTP.");

    const emailTrim = email.trim();

    // 1. Kiểm tra User và tình trạng khóa
    const user = await User.findOne({ email: emailTrim });
    if (!user) throw new AppError(404, "Người dùng không tồn tại.");

    // Kiểm tra nếu tài khoản đang trong thời gian bị khóa
    if (user.lockUntil && user.lockUntil > Date.now()) {
        const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw new AppError(403, `Tài khoản đang bị khóa. Vui lòng thử lại sau ${timeLeft} phút.`);
    }

    // 2. Tìm bản ghi OTP trong database
    const record = await PasswordReset.findOne({ email: emailTrim });
    if (!record) throw new AppError(400, "Mã OTP không tồn tại hoặc hết hạn.");

    // 3. So sánh mã OTP (Bcrypt compare)
    const isMatch = await bcrypt.compare(otp.toString(), record.otp);

    if (!isMatch) {
        // Tăng số lần thử sai (attempts) thêm 1
        const updated = await PasswordReset.findOneAndUpdate({ email: emailTrim }, { $inc: { attempts: 1 } }, { new: true });

        console.log(">>> Số lần thử hiện tại:", updated.attempts);

        // 4. Xử lý khi sai quá 3 lần
        if (updated.attempts >= 3) {
            console.log(">>> ĐANG THỰC HIỆN KHÓA TÀI KHOẢN...");
            const lockTime = Date.now() + 15 * 60 * 1000; // Khóa 15 phút

            await User.updateOne({ email: emailTrim }, { $set: { lockUntil: lockTime } });

            // Xóa mã OTP để bắt buộc xin mã mới sau khi hết khóa
            await PasswordReset.deleteOne({ email: emailTrim });

            throw new AppError(403, "Sai quá 3 lần. Tài khoản của bạn đã bị khóa 15 phút!");
        }

        // Trả về thông báo kèm số lần còn lại (Đã gộp lại)
        const remaining = 3 - updated.attempts;
        throw new AppError(400, `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`);
    }

    // 5. Nếu đúng mã: Xóa trạng thái khóa (nếu có) để người dùng đổi pass
    await User.updateOne({ email: emailTrim }, { $set: { lockUntil: null } });

    return { message: "Xác thực OTP thành công." };
};
// Hàm đặt lại mật khẩu mới
const resetPassword = async({ email, newPassword }) => {
    if (!email || !newPassword) {
        throw new AppError(400, "Vui lòng cung cấp đầy đủ email và mật khẩu mới.");
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
        throw new AppError(404, "Người dùng không tồn tại.");
    }

    // Mã hóa mật khẩu mới
    user.password = await hashPassword(newPassword);
    await user.save();

    // Xóa OTP sau khi đã đổi mật khẩu thành công
    await PasswordReset.deleteMany({ email: email.trim() });

    return { message: "Đặt lại mật khẩu thành công!" };
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    getAllUsers,
    getUserById,
    toggleUserStatus,
    updateProfile,
    changePassword,
    PasswordReset,
    forgotPassword,
    verifyOTP,
    resetPassword,
};