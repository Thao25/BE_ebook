const favoriteService = require("../services/favorite.service");

const handleError = (res, error) =>
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Lỗi server" });

// Controller: nhận req/res, gọi favoriteService để toggle trạng thái.
const toggleFavorite = async (req, res) => {
  try {
    const result = await favoriteService.toggleFavorite(
      req.user._id,
      req.params.bookId
    );
    const status = result.is_favorite ? 201 : 200;
    return res.status(status).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getFavorites = async (req, res) => {
  try {
    const result = await favoriteService.getFavorites(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  toggleFavorite,
  getFavorites,
};
