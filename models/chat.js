const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            trim: true,
            // Legacy field - kept for backward compatibility with plaintext messages
        },
        // Encryption fields for AES-256-GCM
        ciphertext: {
            type: String,
            // Required only if message is encrypted
        },
        iv: {
            type: String,
            // Required only if message is encrypted
        },
        authTag: {
            type: String,
            // Required only if message is encrypted
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
