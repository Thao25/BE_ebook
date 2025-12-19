const bookmarkService = require("../services/bookmark.service");

const handleError = (res, error) =>
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Lỗi server" });

// Controller: nhận request, giao bookmarkService xử lý lưu/ cập nhật.
exports.saveOrUpdateBookmark = async (req, res) => {
  try {
    const result = await bookmarkService.saveOrUpdateBookmark(
      req.user._id,
      req.params.bookId,
      req.body
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getBookmark = async (req, res) => {
  try {
    const result = await bookmarkService.getBookmark(
      req.user._id,
      req.params.bookId
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.deleteBookmark = async (req, res) => {
  try {
    const result = await bookmarkService.deleteBookmark(
      req.user._id,
      req.params.bookId
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getAllBookmarks = async (req, res) => {
  try {
    const result = await bookmarkService.getAllBookmarks(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

