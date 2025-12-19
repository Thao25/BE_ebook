const Favorite = require("../models/favorite");
const Book = require("../models/book");
const AppError = require("../utils/error");

const toggleFavorite = async (userId, bookId) => {
  const book = await Book.findById(bookId);
  if (!book) {
    throw new AppError(404, "Không tìm thấy sách.");
  }

  const existingFavorite = await Favorite.findOne({ user: userId, book: bookId });

  if (existingFavorite) {
    await Favorite.findByIdAndDelete(existingFavorite._id);
    return {
      success: true,
      is_favorite: false,
      message: "Đã bỏ yêu thích.",
    };
  }

  await Favorite.create({ user: userId, book: bookId });
  return {
    success: true,
    is_favorite: true,
    message: "Đã thêm vào yêu thích.",
  };
};

const getFavorites = async (userId) => {
  const favorites = await Favorite.find({ user: userId }).populate("book");
  return { success: true, favorites };
};

module.exports = {
  toggleFavorite,
  getFavorites,
};

