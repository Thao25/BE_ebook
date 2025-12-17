const crypto = require("crypto");

/**
 * AES-256-GCM Encryption Utilities
 * - IV: 12 bytes (96 bits) - recommended for GCM
 * - AuthTag: 16 bytes (128 bits) - standard for GCM
 * - Secret: 32 bytes (256 bits) from environment variable
 */

// Lấy secret từ environment variable
const ENCRYPTION_SECRET = process.env.BOOK_ENCRYPTION_SECRET;

if (!ENCRYPTION_SECRET) {
  throw new Error(
    "BOOK_ENCRYPTION_SECRET environment variable is required for chapter encryption"
  );
}

// Convert secret string to 32-byte key (AES-256 requires 32 bytes)
const getEncryptionKey = () => {
  // Nếu secret là hex string, decode nó
  // Nếu là plain string, hash nó thành 32 bytes
  if (ENCRYPTION_SECRET.length === 64) {
    // Assume hex string (32 bytes = 64 hex chars)
    return Buffer.from(ENCRYPTION_SECRET, "hex");
  }
  // Hash plain string to 32 bytes
  return crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
};

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - Plain text to encrypt
 * @returns {Object} - { ciphertext: base64, iv: base64, authTag: base64 }
 */
const encrypt = (plaintext) => {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Plaintext must be a non-empty string");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // Encrypt
  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

module.exports = {
  encrypt,
};

