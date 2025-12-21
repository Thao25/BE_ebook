// http://localhost:5000/auth/
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.js");
const isAdmin = require("../middlewares/role.middleware");
const auth = require("../middlewares/auth.middleware");
const { uploadAvatar } = require("../middlewares/upload.middleware");

router.post("/register", authController.register);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/get-all", auth, isAdmin, authController.getAllUsers);
router.get("/get-detail-user/:id", authController.getUserById);
router.patch(
    "/update-profile",
    auth,
    uploadAvatar.single("avatar"),
    authController.updateProfile
);
router.patch("/change-password", auth, authController.changePassword);
router.patch(
    "/status-user/:id",
    auth,
    isAdmin,
    authController.toggleUserStatus
);

module.exports = router;