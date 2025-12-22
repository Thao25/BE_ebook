const AppError = require("../utils/error");

// In-memory store
const commentTimestamps = new Map();

// 1 phút
const COMMENT_INTERVAL_MS = 60 * 1000;

/**
 * Limit: 1 comment / 1 minute per user
 */
const limitCommentPerMinute = (req, res, next) => {
  const userId = req.user?.id;
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown";

  // Ưu tiên userId, fallback IP
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  const now = Date.now();

  const lastTime = commentTimestamps.get(key);

  if (lastTime && now - lastTime < COMMENT_INTERVAL_MS) {
    const wait = Math.ceil(
      (COMMENT_INTERVAL_MS - (now - lastTime)) / 1000
    );

    return res.status(429).json({
      message: `Bạn chỉ được bình luận 1 lần mỗi phút. Vui lòng đợi ${wait}s.`,
    });
  }

  // Lưu thời điểm comment
  commentTimestamps.set(key, now);
  next();
};

/**
 * Cleanup tránh leak memory
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of commentTimestamps.entries()) {
    if (now - time > COMMENT_INTERVAL_MS) {
      commentTimestamps.delete(key);
    }
  }
}, 60 * 1000);

module.exports = {
  limitCommentPerMinute,
};
