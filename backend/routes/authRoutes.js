const express = require("express");

const {
  register,
  login,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// PUBLIC AUTH ROUTES
// ===============================

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/verify-reset-otp",
  verifyPasswordResetOTP
);

router.post(
  "/reset-password",
  resetPassword
);

// ===============================
// PROTECTED AUTH ROUTES
// ===============================

router.get(
  "/me",
  protect,
  getMe
);

router.put(
  "/profile",
  protect,
  updateProfile
);

router.put(
  "/change-password",
  protect,
  changePassword
);

module.exports = router;