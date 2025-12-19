const User = require("../models/user");
const { verifyAccessToken } = require("../utils/jwt");

/**
 * Middleware: đọc JWT từ header, dùng utils verifyAccessToken và gắn user vào request.
 */
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Bạn chưa đăng nhập." });

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại." });
    }

    req.user = { ...user.toObject(), id: user._id.toString() };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ." });
  }
};

module.exports = authMiddleware;
