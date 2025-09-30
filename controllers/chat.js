const Message = require("../models/chat");

// Lấy danh sách tin nhắn từ cũ đến mới -
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("user", "fullName profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error("Lỗi lấy tin nhắn:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Gửi tin nhắn mới
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Nội dung không được để trống" });
    }

    const message = await Message.create({
      user: userId,
      content,
    });

    const populatedMsg = await message.populate(
      "user",
      "fullName profileImage"
    );

    // Phát sự kiện real-time qua socket
    req.io.emit("newMessage", populatedMsg);

    res.status(201).json({ success: true, message: populatedMsg });
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
