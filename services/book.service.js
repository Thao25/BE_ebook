const Book = require("../models/book");
const BookChapter = require("../models/bookChapter");
const AppError = require("../utils/error");
const { deleteFileIfExists } = require("../utils/file");

const buildPublicUrl = (folder, filename) =>
  `http://localhost:5000/uploads/${folder}/${filename}`;

const createBook = async (payload, files, chapters = []) => {
  const { title, author, description, category } = payload;

  if (!title || !author || !category) {
    throw new AppError(400, "Thiếu thông tin bắt buộc của sách.");
  }

  const cover = files?.cover_url?.[0];
  const file = files?.file_url?.[0];

  const newBook = await Book.create({
    title,
    author,
    description,
    cover_url: cover ? buildPublicUrl("books", cover.filename) : "",
    file_url: file ? buildPublicUrl("books", file.filename) : "",
    category,
    has_chapters: Array.isArray(chapters) && chapters.length > 0,
  });

  if (Array.isArray(chapters) && chapters.length) {
    const uniqueMap = new Map();
    chapters.forEach((chapter) => {
      if (!uniqueMap.has(chapter.chapter_number)) {
        uniqueMap.set(chapter.chapter_number, chapter);
      }
    });

    const chapterDocs = Array.from(uniqueMap.values()).map((chapter) => ({
      ...chapter,
      book: newBook._id,
    }));

    if (chapterDocs.length) {
      await BookChapter.insertMany(chapterDocs);
    }
  }

  return {
    success: true,
    message: "Tạo sách thành công",
    book: newBook,
  };
};

const getChaptersByBook = async (bookId) => {
  const book = await Book.findById(bookId);
  if (!book) {
    throw new AppError(404, "Không tìm thấy sách");
  }

  const chapters = await BookChapter.find({ book: book._id })
    .sort("chapter_number")
    .select("-content");

  return { success: true, chapters };
};

const getChapterContent = async ({ bookId, chapter_number }) => {
  const chapterNumber = Number(chapter_number);
  if (Number.isNaN(chapterNumber)) {
    throw new AppError(400, "Số chương không hợp lệ");
  }

  const chapter = await BookChapter.findOne({
    book: bookId,
    chapter_number: chapterNumber,
  });

  if (!chapter) {
    throw new AppError(404, "Không tìm thấy chương");
  }

  return { success: true, chapter };
};

const getAllBooks = async () => {
  const books = await Book.find({ is_active: true })
    .populate("category", "name")
    .sort({ createdAt: -1 });
  return { success: true, books };
};

const getBookLock = async () => {
  const books = await Book.find({ is_active: false })
    .populate("category", "name")
    .sort({ createdAt: -1 });
  return { success: true, books };
};

const getBookById = async (id) => {
  const book = await Book.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("category", "name");

  if (!book || !book.is_active) {
    throw new AppError(404, "Không tìm thấy sách");
  }

  return { success: true, book };
};

const getBookByIdNoView = async (id) => {
  const book = await Book.findById(id).populate("category", "name");
  if (!book || !book.is_active) {
    throw new AppError(404, "Không tìm thấy sách");
  }
  return { success: true, book };
};

const getAllBookById = async (id) => {
  const book = await Book.findById(id).populate("category", "name");
  if (!book) {
    throw new AppError(404, "Không tìm thấy sách");
  }
  await Book.findByIdAndUpdate(id);
  return { success: true, book };
};

const updateCover = async (id, file) => {
  if (!file) {
    throw new AppError(400, "Chưa upload ảnh bìa mới.");
  }

  const updated = await Book.findByIdAndUpdate(
    id,
    { cover_url: `http://localhost:5000/uploads/avatars/${file.filename}` },
    { new: true }
  );

  if (!updated) {
    throw new AppError(404, "Không tìm thấy sách để cập nhật ảnh bìa.");
  }

  return {
    success: true,
    message: "Cập nhật ảnh bìa thành công",
    book: updated,
  };
};

const toggleBookStatus = async (id) => {
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError(400, "Không tìm thấy sách");
  }
  book.is_active = !book.is_active;
  await book.save();

  return {
    message: "Đã cập nhật trạng thái sách",
    is_active: book.is_active,
  };
};

const deleteBook = async (id) => {
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError(404, "Không tìm thấy sách");
  }

  deleteFileIfExists(book.cover_url);
  deleteFileIfExists(book.file_url);

  await BookChapter.deleteMany({ book: book._id });
  await Book.findByIdAndDelete(book._id);

  return {
    success: true,
    message: "Đã xóa hoàn toàn sách và các chương",
  };
};

const getBooksByCategory = async (categoryId) => {
  const books = await Book.find({ category: categoryId, is_active: true })
    .populate("category", "name")
    .sort({ created_at: -1 });
  return { success: true, books };
};

const getTopViewedBooks = async (limit = 5) => {
  const topBooks = await Book.find()
    .sort({ views: -1 })
    .limit(limit)
    .select("title author views cover_url");

  return { success: true, data: topBooks };
};

module.exports = {
  createBook,
  getChaptersByBook,
  getChapterContent,
  getAllBooks,
  getBookLock,
  getBookById,
  getBookByIdNoView,
  getAllBookById,
  updateCover,
  toggleBookStatus,
  deleteBook,
  getBooksByCategory,
  getTopViewedBooks,
};

