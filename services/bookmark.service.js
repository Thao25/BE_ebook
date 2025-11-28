const Bookmark = require("../models/bookmark");
const AppError = require("../utils/error");

const saveOrUpdateBookmark = async (userId, bookId, { chapterId, progress }) => {
  const bookmark = await Bookmark.findOneAndUpdate(
    { user: userId, book: bookId },
    { chapter: chapterId, progress },
    { new: true, upsert: true }
  );

  return { success: true, bookmark };
};

const getBookmark = async (userId, bookId) => {
  const bookmark = await Bookmark.findOne({
    user: userId,
    book: bookId,
  }).populate("chapter", "chapter_number title");

  if (!bookmark) {
    throw new AppError(404, "Chưa có bookmark");
  }

  return { success: true, bookmark };
};

const deleteBookmark = async (userId, bookId) => {
  const result = await Bookmark.findOneAndDelete({
    user: userId,
    book: bookId,
  });

  if (!result) {
    throw new AppError(404, "Bookmark không tồn tại");
  }

  return { success: true, message: "Đã xoá bookmark" };
};

const getAllBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({ user: userId })
    .populate("book", "title author cover_url")
    .sort({ updatedAt: -1 });

  return { success: true, bookmarks };
};

module.exports = {
  saveOrUpdateBookmark,
  getBookmark,
  deleteBookmark,
  getAllBookmarks,
};

