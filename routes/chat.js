const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, chatController.getMessages);
router.post("/", authMiddleware, chatController.sendMessage);

module.exports = router;
