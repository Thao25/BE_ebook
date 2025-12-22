const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateInput } = require("../middlewares/inputValidation.middleware");

router.get("/", authMiddleware, chatController.getMessages);
router.post("/", authMiddleware, validateInput, chatController.sendMessage);

module.exports = router;
