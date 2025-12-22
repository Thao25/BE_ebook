const xss = require("xss");

/**
 * XSS Sanitization Utility
 * Sanitizes user input to prevent XSS attacks
 */
const sanitizeInput = (input) => {
  if (typeof input !== "string") {
    return input;
  }
  // Remove script tags and escape HTML
  return xss(input, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script"],
  });
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return typeof obj === "string" ? sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
};


