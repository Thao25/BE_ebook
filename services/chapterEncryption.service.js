const { encrypt } = require("../utils/crypto");

/**
 * Chapter Encryption Service
 * - Serialize chapter content to JSON before encryption
 * - Encrypt using AES-256-GCM
 * - Return standardized format for storage
 */

/**
 * Encrypt chapter content
 * @param {string|Object} plaintextContent - Plain text or object to encrypt
 * @returns {Object} - { ciphertext: base64, iv: base64, authTag: base64 }
 */
const encryptChapterContent = (plaintextContent) => {
  if (!plaintextContent) {
    throw new Error("Chapter content cannot be empty");
  }

  // Serialize to JSON string if it's an object, otherwise use as string
  const jsonString =
    typeof plaintextContent === "string"
      ? plaintextContent
      : JSON.stringify(plaintextContent);

  // Encrypt using AES-256-GCM
  const encrypted = encrypt(jsonString);

  return encrypted;
};

module.exports = {
  encryptChapterContent,
};

