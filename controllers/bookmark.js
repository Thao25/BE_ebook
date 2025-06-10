const Bookmark = require("../models/bookmark");

exports.saveOrUpdateBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId } = req.params;
    const { chapterId, progress } = req.body;

    const bookmark = await Bookmark.findOneAndUpdate(
      { user: userId, book: bookId },
      { chapter: chapterId, progress },
      { new: true, upsert: true } // tạo mới nếu chưa có
    );
    console.log("Authorization Header:", req.headers.authorization);
    console.log("Decoded User:", req.user);

    res.status(200).json({ success: true, bookmark });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId } = req.params;

    const bookmark = await Bookmark.findOne({
      user: userId,
      book: bookId,
    }).populate("chapter", "chapter_number title");

    if (!bookmark) {
      return res
        .status(404)
        .json({ success: false, message: "Chưa có bookmark" });
    }

    res.status(200).json({ success: true, bookmark });
  } catch (error) {
    console.error("Lỗi lấy bookmark:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
