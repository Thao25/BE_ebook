// Ensure dotenv is loaded early (fallback if imported before server.js)
require("dotenv").config();

const crypto = require("crypto");

/**
 * AES-256-GCM Encryption Utilities for Chat Messages
 * - IV: 12 bytes (96 bits) - recommended for GCM
 * - AuthTag: 16 bytes (128 bits) - standard for GCM
 * - Secret: 32 bytes (256 bits) hex string from CHAT_SECRET env variable
 */

const CHAT_SECRET = process.env.CHAT_SECRET;
if (!CHAT_SECRET) {
  throw new Error(
    "CHAT_SECRET environment variable is required for chat message encryption"
  );
}

/**
 * Get encryption key from CHAT_SECRET
 * Expects CHAT_SECRET to be a 64-character hex string (32 bytes)
 * @returns {Buffer} 32-byte key for AES-256
 */
const getEncryptionKey = () => {
  if (CHAT_SECRET.length === 64) {
    // Hex string (32 bytes = 64 hex chars)
    return Buffer.from(CHAT_SECRET, "hex");
  }
  // Fallback: hash plain string to 32 bytes
  return crypto.createHash("sha256").update(CHAT_SECRET).digest();
};

/**
 * Encrypt message content using AES-256-GCM
 * @param {string} plaintext - Plain text message to encrypt
 * @returns {Object} - { ciphertext: base64, iv: base64, authTag: base64 }
 */
const encryptMessage = (plaintext) => {
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

/**
 * Decrypt message content using AES-256-GCM
 * @param {string} ciphertextBase64 - Base64 encoded ciphertext
 * @param {string} ivBase64 - Base64 encoded 12-byte IV
 * @param {string} authTagBase64 - Base64 encoded 16-byte auth tag
 * @returns {string} - Decrypted plaintext UTF-8 string
 */
const decryptMessage = (ciphertextBase64, ivBase64, authTagBase64) => {
  if (!CHAT_SECRET) {
    throw new Error("CHAT_SECRET is not configured");
  }

  if (!ciphertextBase64 || !ivBase64 || !authTagBase64) {
    throw new Error("Missing encryption metadata");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const ciphertext = Buffer.from(ciphertextBase64, "base64");

  if (iv.length !== 12) {
    throw new Error("Invalid IV length for AES-256-GCM (expected 12 bytes)");
  }

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    // Do NOT leak key or ciphertext details in error messages
    throw new Error("Failed to decrypt message content");
  }
};

module.exports = {
  encryptMessage,
  decryptMessage,
};

