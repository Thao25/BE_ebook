const AppError = require("../utils/error");

/**
 * SQL Injection pattern detection
 */
const SQL_INJECTION_PATTERNS = [
  /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
  /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
  /('|"|;|\-\-|\/\*|\*\/|xp_|sp_)/i,
  /(\bOR\b|\bAND\b)\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
  /(\bOR\b|\bAND\b)\s+['"]?['"]?\s*=\s*['"]?['"]?/i,
];

/**
 * Check if input contains SQL injection patterns
 */
const containsSQLInjection = (input) => {
  if (typeof input !== "string") {
    return false;
  }
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
};

/**
 * Validate and sanitize request body/query/params
 */
const validateInput = (req, res, next) => {
  const checkValue = (value, path = "") => {
    if (typeof value === "string") {
      if (containsSQLInjection(value)) {
        throw new AppError(
          400,
          "Input chứa ký tự không hợp lệ"
        );
      }
    } else if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else {
        Object.keys(value).forEach((key) =>
          checkValue(value[key], path ? `${path}.${key}` : key)
        );
      }
    }
  };

  try {
    if (req.body) checkValue(req.body, "body");
    if (req.query) checkValue(req.query, "query");
    if (req.params) checkValue(req.params, "params");
    next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      message: error.message || "Input không hợp lệ",
    });
  }
};
const validateUpdateProfile = (req, res, next) => {
  const { name, phone, gender, dateOfBirth } = req.body;

  if (name !== undefined) {
    if (!/^[a-zA-ZÀ-ỹ\s]{2,50}$/.test(name)) {
      return res.status(400).json({ message: "Tên không hợp lệ" });
    }
  }

  if (phone !== undefined) {
    if (!/^[0-9]{9,11}$/.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
  }

  if (gender !== undefined) {
    if (!["nam", "nu", "khac"].includes(gender)) {
      return res.status(400).json({ message: "Giới tính không hợp lệ" });
    }
  }

  if (dateOfBirth !== undefined) {
    if (isNaN(Date.parse(dateOfBirth))) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
    }
  }

  next();
};

module.exports = {
  validateInput,
  containsSQLInjection,
  validateUpdateProfile
};


