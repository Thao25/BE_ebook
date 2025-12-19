const categoryService = require("../services/category.service");

const handleError = (res, error) =>
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Lỗi server" });

// Controller: chỉ định tuyến request tới categoryService và trả JSON.
const createCategory = async (req, res) => {
  try {
    const result = await categoryService.createCategory(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const result = await categoryService.getAllCategories();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getBooksByCategory = async (req, res) => {
  try {
    const result = await categoryService.getBooksByCategory(
      req.params.id,
      req.query.is_active
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createCategory,
  deleteCategory,
  getAllCategories,
  getBooksByCategory,
};
