const reportService = require("../services/report.service");

const handleError = (res, error) =>
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Lỗi server" });

exports.getOverview = async (req, res) => {
  try {
    const result = await reportService.getOverview();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getBooksByCategoryStats = async (req, res) => {
  try {
    const result = await reportService.getBooksByCategoryStats();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getComment_wmy = async (req, res) => {
  try {
    const result = await reportService.getCommentStats({
      range: req.query.range,
      bookId: req.query.bookId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getNewUsers_wmy = async (req, res) => {
  try {
    const result = await reportService.getNewUsersStats({
      range: req.query.range,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};
