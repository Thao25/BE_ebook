const User = require("../models/user");
const Token = require("../models/token");
const AppError = require("../utils/error");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const registerUser = async ({ name, email, password, role }) => {
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

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError(400, "Email và mật khẩu là bắt buộc.");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(400, "Email không tồn tại.");
  }

  if (!user.is_active) {
    throw new AppError(
      403,
      "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên."
    );
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError(400, "Sai mật khẩu.");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await Token.findOneAndUpdate(
    { user: user._id },
    { refreshToken },
    { upsert: true, new: true }
  );

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

const refreshAccessToken = async (refreshToken) => {
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

const getAllUsers = async () => {
  const users = await User.find().select("-password");
  return { message: "success", data: users };
};

const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) {
    throw new AppError(404, "Không tìm thấy người dùng");
  }
  return { message: "success", data: user };
};

const toggleUserStatus = async (id, io) => {
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

const updateProfile = async (userId, payload, file) => {
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

const changePassword = async (userId, { oldPassword, newPassword }) => {
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

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  updateProfile,
  changePassword,
};

