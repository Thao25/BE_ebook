/**
 * Global Error Handler Middleware
 * Prevents SQL error messages and sensitive information from being exposed
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (server-side only)
  console.error("Error:", err);

  // Check for MongoDB/Mongoose errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    return res.status(500).json({
      message: "Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.",
    });
  }

  // Check for validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ.",
    });
  }

  // Check for CastError (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "ID không hợp lệ.",
    });
  }

  // Generic error response
  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi server";

  // Do not expose internal error details in production
  return res.status(statusCode).json({
    message: statusCode === 500 ? "Lỗi server" : message,
  });
};

module.exports = errorHandler;


