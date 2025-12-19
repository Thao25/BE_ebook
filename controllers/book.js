const bookService = require("../services/book.service");

const handleError = (res, error) =>
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Lỗi server" });

// Controller: nhận req/res và uỷ quyền cho bookService xử lý tạo sách.
const createBook = async (req, res) => {
  try {
    const result = await bookService.createBook(
      req.body,
      req.files,
      req.chapters
    );
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getChaptersByBook = async (req, res) => {
  try {
    const result = await bookService.getChaptersByBook(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getChapterContent = async (req, res) => {
  try {
    const result = await bookService.getChapterContent(req.params);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllBooks = async (req, res) => {
  try {
    const result = await bookService.getAllBooks();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getBookLock = async (req, res) => {
  try {
    const result = await bookService.getBookLock();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getBookById = async (req, res) => {
  try {
    const result = await bookService.getBookById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getBookByIdNoView = async (req, res) => {
  try {
    const result = await bookService.getBookByIdNoView(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllBookById = async (req, res) => {
  try {
    const result = await bookService.getAllBookById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateCover = async (req, res) => {
  try {
    const result = await bookService.updateCover(req.params.id, req.file);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const toggleBookStatus = async (req, res) => {
  try {
    const result = await bookService.toggleBookStatus(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteBook = async (req, res) => {
  try {
    const result = await bookService.deleteBook(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getBooksByCategory = async (req, res) => {
  try {
    const result = await bookService.getBooksByCategory(req.params.categoryId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getTopViewedBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const result = await bookService.getTopViewedBooks(limit);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookLock,
  getBookById,
  getAllBookById,
  getChaptersByBook,
  getChapterContent,
  updateCover,
  toggleBookStatus,
  deleteBook,
  getBooksByCategory,
  getTopViewedBooks,
  getBookByIdNoView,
};
