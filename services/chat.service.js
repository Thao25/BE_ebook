const Message = require("../models/chat");
const AppError = require("../utils/error");

const getMessages = async () => {
  const messages = await Message.find()
    .populate("user", "fullName name profileImage avatar")
    .sort({ createdAt: -1 });

  return { success: true, messages: messages.reverse() };
};

const sendMessage = async (userId, { content }, io) => {
  if (!content || !content.trim()) {
    throw new AppError(400, "Nội dung không được để trống");
  }

  const message = await Message.create({ user: userId, content });
  const populatedMsg = await message.populate(
    "user",
    "fullName name profileImage avatar"
  );

  if (io) {
    io.emit("newMessage", populatedMsg);
  }

  return { success: true, message: populatedMsg };
};

module.exports = {
  getMessages,
  sendMessage,
};

