const chatService = require("../services/chat.service");

const handleError = (res, error) =>
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Lỗi server" });

// Controller: chỉ gọi chatService để lấy tin nhắn.
exports.getMessages = async (req, res) => {
  try {
    const result = await chatService.getMessages();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// Controller: gửi yêu cầu tới chatService để tạo tin nhắn mới.
exports.sendMessage = async (req, res) => {
  try {
    const io = req.app.get("io") || req.io;
    const result = await chatService.sendMessage(req.user._id, req.body, io);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};