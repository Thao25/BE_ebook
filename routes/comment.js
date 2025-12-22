// http://localhost:5000/comment/

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/role.middleware");
const commentController = require("../controllers/comment");
const { validateInput } = require("../middlewares/inputValidation.middleware");
const {limitCommentPerMinute} = require("../middlewares/commentRateLimit");

router.post("/", auth, validateInput,limitCommentPerMinute,commentController.createComment);
router.get("/book/:bookId", auth, validateInput, commentController.getCommentsByBook);
//admin dùng thôi
router.get(
  "/all-book/:bookId",
  auth,
  isAdmin,
  validateInput,
  commentController.getAllCommentsByBook
);
router.patch("/update/:id", auth, validateInput, commentController.updateComment);
router.patch("/toggle/:id", auth, isAdmin, validateInput, commentController.toggleComment);
router.delete("/delete/:id", auth, validateInput, commentController.deleteComment);

module.exports = router;
