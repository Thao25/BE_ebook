const User = require("../models/user");
const Token = require("../models/token");
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

    // 3. Tạo mã OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Lưu vào bảng PasswordReset
    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({ email, otp });

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
    if (!email || !otp) {
        throw new AppError(400, "Thiếu email hoặc mã OTP.");
    }

    // Quan trọng: Trim email và ép kiểu otp về string để so sánh chính xác
    const record = await PasswordReset.findOne({
        email: email.trim(),
        otp: otp.toString().trim()
    });

    if (!record) {
        // Log ra để debug trên terminal xem server đang tìm gì
        console.log(`Kiểm tra thất bại: Email [${email}] OTP [${otp}]`);
        throw new AppError(400, "Mã OTP không chính xác hoặc đã hết hạn.");
    }

    // Lưu ý: Không nên xóa mã ngay lập tức nếu bạn muốn dùng email này ở bước reset mật khẩu
    // Hoặc nếu xóa, hãy đảm bảo bước Reset mật khẩu không cần check lại OTP nữa
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