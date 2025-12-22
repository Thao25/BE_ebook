const Category = require("../models/category");
const Book = require("../models/book");
const BookChapter = require("../models/bookChapter");
const AppError = require("../utils/error");
const { deleteFileIfExists } = require("../utils/file");
const { sanitizeInput } = require("../utils/sanitize");

const createCategory = async ({ name }) => {
  if (!name) {
    throw new AppError(400, "Tên category là bắt buộc");
  }

  let newCategory;
  try {
    newCategory = await Category.create({ name: sanitizeInput(name) });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(400, "Category đã tồn tại");
    }
    throw error;
  }

  return {
    message: "Đã tạo thành công",
    category: newCategory,
  };
};

const getAllCategories = async () => {
  const categories = await Category.find().sort({ name: 1 });
  return {
    success: "true",
    categories,
  };
};

const deleteCategory = async (categoryId) => {
  const books = await Book.find({ category: categoryId });

  for (const book of books) {
    deleteFileIfExists(book.cover_url?.replace("http://localhost:5000", "./public"));
    deleteFileIfExists(book.file_url?.replace("http://localhost:5000", "./public"));
    await BookChapter.deleteMany({ book: book._id });
    await Book.findByIdAndDelete(book._id);
  }

  const deletedCategory = await Category.findByIdAndDelete(categoryId);
  if (!deletedCategory) {
    throw new AppError(404, "Category không tìm thấy");
  }

  return { message: "Đã xóa category và toàn bộ sách liên quan" };
};

const getBooksByCategory = async (categoryId, isActive) => {
  const query = { category: categoryId };
  if (typeof isActive !== "undefined") {
    query.is_active = isActive === "true";
  }

  const books = await Book.find(query)
    .populate("category", "name")
    .sort({ created_at: -1 });

  return { success: true, books };
};

module.exports = {
  createCategory,
  deleteCategory,
  getAllCategories,
  getBooksByCategory,
};

