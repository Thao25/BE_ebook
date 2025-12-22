// http://localhost:5000/auth/
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.js");
const isAdmin = require("../middlewares/role.middleware");
const auth = require("../middlewares/auth.middleware");
const { uploadAvatar } = require("../middlewares/upload.middleware");
const { validateInput, validateUpdateProfile } = require("../middlewares/inputValidation.middleware");
const { bruteForceProtection } = require("../middlewares/bruteForce.middleware");

router.post("/register", validateInput, authController.register);
router.post("/forgot-password", validateInput, authController.forgotPassword);
router.post("/verify-otp", validateInput, authController.verifyOTP);
router.post("/reset-password", validateInput, authController.resetPassword);
router.post("/login", validateInput, bruteForceProtection, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/get-all", auth, isAdmin, authController.getAllUsers);
router.get("/get-detail-user/:id", authController.getUserById);
router.patch(
    "/update-profile",
    auth,
    uploadAvatar.single("avatar"),
    // validateUpdateProfile,
    authController.updateProfile
);
router.patch("/change-password", validateInput,auth, authController.changePassword);
router.patch(
    "/status-user/:id",
    auth,
    isAdmin,
    authController.toggleUserStatus
);

module.exports = router;