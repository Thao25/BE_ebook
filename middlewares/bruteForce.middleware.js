const AppError = require("../utils/error");

/**
 * Brute Force Attack Prevention
 * Tracks failed login attempts per IP and user
 */

// In-memory store (use Redis in production)
const failedAttempts = new Map();
const blockedIPs = new Map();

// Configuration
const MAX_FAILED_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    "unknown"
  );
};

/**
 * Check if IP is blocked
 */
const isIPBlocked = (ip) => {
  const blockedUntil = blockedIPs.get(ip);
  if (!blockedUntil) {
    return false;
  }
  if (Date.now() > blockedUntil) {
    blockedIPs.delete(ip);
    failedAttempts.delete(ip);
    return false;
  }
  return true;
};

/**
 * Record failed login attempt
 */
const recordFailedAttempt = (ip, email) => {
  const key = `${ip}:${email || "unknown"}`;
  const now = Date.now();

  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, { count: 0, firstAttempt: now });
  }

  const attempt = failedAttempts.get(key);
  attempt.count += 1;

  // Reset if window expired
  if (now - attempt.firstAttempt > WINDOW_MS) {
    attempt.count = 1;
    attempt.firstAttempt = now;
  }

  // Block if threshold exceeded
  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    blockedIPs.set(ip, now + BLOCK_DURATION_MS);
  }
};

/**
 * Clear failed attempts on successful login
 */
const clearFailedAttempts = (ip, email) => {
  const key = `${ip}:${email || "unknown"}`;
  failedAttempts.delete(key);
};

/**
 * Brute force protection middleware
 */
const bruteForceProtection = (req, res, next) => {
  const ip = getClientIP(req);
  const email = req.body?.email;

  if (isIPBlocked(ip)) {
    return res.status(429).json({
      message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
    });
  }

  // Attach helper functions to request
  req.recordFailedAttempt = () => recordFailedAttempt(ip, email);
  req.clearFailedAttempts = () => clearFailedAttempts(ip, email);

  next();
};

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, blockedUntil] of blockedIPs.entries()) {
    if (now > blockedUntil) {
      blockedIPs.delete(ip);
    }
  }
  for (const [key, attempt] of failedAttempts.entries()) {
    if (now - attempt.firstAttempt > WINDOW_MS) {
      failedAttempts.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

module.exports = {
  bruteForceProtection,
  recordFailedAttempt,
  clearFailedAttempts,
  isIPBlocked,
};


