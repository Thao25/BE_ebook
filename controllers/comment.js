const commentService = require("../services/comment.service");

const handleError = (res, error) =>
  res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Lỗi server" });

exports.createComment = async (req, res) => {
  try {
    const io = req.app.get("io") || req.io;
    const result = await commentService.createComment(req.user._id, req.body, io);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getCommentsByBook = async (req, res) => {
  try {
    const result = await commentService.getCommentsByBook(req.params.bookId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getAllCommentsByBook = async (req, res) => {
  try {
    const result = await commentService.getAllCommentsByBook(req.params.bookId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updateComment = async (req, res) => {
  try {
    const io = req.app.get("io") || req.io;
    const result = await commentService.updateComment(
      req.user.id,
      req.params.id,
      req.body,
      io
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.toggleComment = async (req, res) => {
  try {
    const io = req.app.get("io") || req.io;
    const result = await commentService.toggleComment(
      req.user.role,
      req.params.id,
      io
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const io = req.app.get("io") || req.io;
    const result = await commentService.deleteComment(
      req.user,
      req.params.id,
      io
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};
