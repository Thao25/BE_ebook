const Comment = require("../models/comment");
const AppError = require("../utils/error");

const createComment = async (userId, payload, io) => {
  const { book, rating, comment } = payload;
  if (!book) {
    throw new AppError(400, "Thiếu thông tin sách.");
  }

  const newComment = await Comment.create({
    user: userId,
    book,
    rating,
    comment,
  });

  await newComment.populate("user", "name avatar is_active role");

  if (io) {
    io.to(book).emit("new-comment", newComment);
  }

  return { success: true, comment: newComment };
};

const getCommentsByBook = async (bookId) => {
  const comments = await Comment.find({ book: bookId, is_hidden: false })
    .populate("user", "name avatar is_active role")
    .sort({ created_at: -1 });

  return { success: true, comments };
};

const getAllCommentsByBook = async (bookId) => {
  const comments = await Comment.find({ book: bookId })
    .populate("user", "name avatar is_active role")
    .sort({ created_at: -1 });

  return { success: true, comments };
};

const updateComment = async (userId, commentId, payload, io) => {
  const existingComment = await Comment.findById(commentId);
  if (!existingComment) {
    throw new AppError(404, "Không tìm thấy bình luận.");
  }

  if (existingComment.user.toString() !== userId) {
    throw new AppError(403, "Bạn không có quyền sửa bình luận này.");
  }

  const { comment, rating } = payload;
  if (comment !== undefined) existingComment.comment = comment;
  if (rating !== undefined) existingComment.rating = rating;

  await existingComment.save();
  await existingComment.populate("user", "name avatar is_active role");

  if (io) {
    io.to(existingComment.book.toString()).emit(
      "comment-updated",
      existingComment
    );
  }

  return {
    success: true,
    message: "Cập nhật bình luận thành công.",
    comment: existingComment,
  };
};

const toggleComment = async (userRole, commentId, io) => {
  if (userRole !== "admin") {
    throw new AppError(403, "Chỉ admin mới được ẩn/hiện bình luận.");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError(404, "Không tìm thấy bình luận.");
  }

  comment.is_hidden = !comment.is_hidden;
  await comment.save();
  await comment.populate("user", "name avatar is_active role");

  if (io) {
    io.to(comment.book.toString()).emit("comment-updated", comment);
  }

  return {
    success: true,
    message: `Đã ${comment.is_hidden ? "ẩn" : "hiện"} bình luận.`,
    is_hidden: comment.is_hidden,
  };
};

const deleteComment = async (user, commentId, io) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError(404, "Không tìm thấy bình luận.");
  }

  if (user.role !== "admin" && comment.user.toString() !== user.id) {
    throw new AppError(403, "Bạn không có quyền xóa bình luận.");
  }

  const bookRoom = comment.book.toString();
  await comment.deleteOne();

  if (io) {
    io.to(bookRoom).emit("comment-deleted", { id: commentId });
  }

  return { success: true, message: "Đã xóa bình luận." };
};

module.exports = {
  createComment,
  getCommentsByBook,
  getAllCommentsByBook,
  updateComment,
  toggleComment,
  deleteComment,
};

