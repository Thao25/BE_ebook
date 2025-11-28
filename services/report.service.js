const mongoose = require("mongoose");
const Book = require("../models/book");
const User = require("../models/user");
const Comment = require("../models/comment");

const getStartDateByRange = (range) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  switch (range) {
    case "7d":
    case "1w":
      now.setDate(now.getDate() - 7);
      break;
    case "1m":
      now.setMonth(now.getMonth() - 1);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      now.setDate(now.getDate() - 7);
  }
  return now;
};

const getOverview = async () => {
  const [totalBooks, totalUsers, totalComments, totalViews] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments(),
    Comment.countDocuments(),
    Book.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
  ]);

  return {
    success: true,
    data: {
      totalBooks,
      totalUsers,
      totalComments,
      totalViews: totalViews[0]?.total || 0,
    },
  };
};

const getBooksByCategoryStats = async () => {
  const stats = await Book.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        categoryName: "$category.name",
        count: 1,
      },
    },
  ]);

  return { success: true, data: stats };
};

const getCommentStats = async ({ range = "7d", bookId }) => {
  const startDate = getStartDateByRange(range);
  const matchStage = { created_at: { $gte: startDate } };

  if (bookId) {
    matchStage.book = new mongoose.Types.ObjectId(bookId);
  }

  const comments = await Comment.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "books",
        localField: "book",
        foreignField: "_id",
        as: "book",
      },
    },
    { $unwind: "$book" },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        date: { $dateToString: { format: "%d-%m-%Y", date: "$created_at" } },
        content: 1,
        created_at: 1,
        bookTitle: "$book.title",
        bookAuthor: "$book.author",
        bookCover: "$book.cover",
        bookCategory: "$book.category",
        bookId: "$book._id",
        userName: "$user.name",
      },
    },
    { $sort: { created_at: -1 } },
  ]);

  return { success: true, data: comments };
};

const getNewUsersStats = async ({ range = "7d" }) => {
  const startDate = getStartDateByRange(range);

  const stats = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
        users: {
          $push: {
            _id: "$_id",
            name: "$name",
            email: "$email",
            created_at: "$createdAt",
          },
        },
      },
    },
    {
      $project: {
        year: "$_id.year",
        month: "$_id.month",
        count: 1,
        users: 1,
        _id: 0,
      },
    },
    { $sort: { year: -1, month: -1 } },
  ]);

  return { success: true, data: stats };
};

module.exports = {
  getOverview,
  getBooksByCategoryStats,
  getCommentStats,
  getNewUsersStats,
};

