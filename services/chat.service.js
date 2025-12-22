const Message = require("../models/chat");
const AppError = require("../utils/error");
const { encryptMessage, decryptMessage } = require("../utils/chatCrypto");
const { sanitizeInput } = require("../utils/sanitize");

/**
 * Decrypt message content if encrypted, otherwise return plaintext
 * Handles backward compatibility with plaintext messages
 */
const decryptMessageContent = (message) => {
  // If message has encryption fields, decrypt it
  if (message.ciphertext && message.iv && message.authTag) {
    try {
      const decryptedContent = decryptMessage(
        message.ciphertext,
        message.iv,
        message.authTag
      );
      // Sanitize decrypted content as extra safety layer
      const sanitizedContent = sanitizeInput(decryptedContent);
      return {
        ...message.toObject(),
        content: sanitizedContent,
        // Remove encryption fields from response
        ciphertext: undefined,
        iv: undefined,
        authTag: undefined,
      };
    } catch (error) {
      console.error("Failed to decrypt message:", error.message);
      // Return message with error indicator or fallback to plaintext
      return {
        ...message.toObject(),
        content: message.content ? sanitizeInput(message.content) : "[Không thể giải mã tin nhắn]",
        ciphertext: undefined,
        iv: undefined,
        authTag: undefined,
      };
    }
  }
  // Backward compatibility: sanitize plaintext message
  const sanitized = message.toObject();
  if (sanitized.content) {
    sanitized.content = sanitizeInput(sanitized.content);
  }
  return sanitized;
};

const getMessages = async () => {
  const messages = await Message.find()
    .populate("user", "fullName name profileImage avatar")
    .sort({ createdAt: -1 });

  // Decrypt all messages before returning
  const decryptedMessages = messages.map(decryptMessageContent);

  return { success: true, messages: decryptedMessages.reverse() };
};

const sendMessage = async (userId, { content }, io) => {
  if (!content || !content.trim()) {
    throw new AppError(400, "Nội dung không được để trống");
  }

  // Sanitize content to prevent XSS
  const sanitizedContent = sanitizeInput(content.trim());

  // Encrypt message content before saving
  const encrypted = encryptMessage(sanitizedContent);

  // Create message with encrypted fields
  const message = await Message.create({
    user: userId,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    // Do NOT store plaintext content
  });

  // Populate user info
  const populatedMsg = await message.populate(
    "user",
    "fullName name profileImage avatar"
  );

  // Decrypt for Socket.io emission and response
  const decryptedMsg = decryptMessageContent(populatedMsg);

  if (io) {
    io.emit("newMessage", decryptedMsg);
  }

  return { success: true, message: decryptedMsg };
};

module.exports = {
  getMessages,
  sendMessage,
};

