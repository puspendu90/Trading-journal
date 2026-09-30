const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const PasswordResetOTP = require("../models/PasswordResetOTP");

const {
  sendPasswordResetOTP,
} = require("../services/emailService");

// ===============================
// GENERATE JWT TOKEN
// ===============================
const generateToken = (userId) => {
  return jwt.sign(
    {
      userId: userId.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ===============================
// REGISTER
// ===============================
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      timezone,
      currency,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      timezone: timezone || "UTC",
      currency: currency || "USD",
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        timezone: user.timezone,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
};

// ===============================
// LOGIN
// ===============================
const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    user.lastLogin = new Date();

    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        timezone: user.timezone,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

// ===============================
// FORGOT PASSWORD - SEND OTP
// ===============================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Security:
    // Do not reveal whether the email exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification code has been sent.",
      });
    }

    // Delete previous OTP requests
    await PasswordResetOTP.deleteMany({
      email: normalizedEmail,
    });

    // Generate secure 6-digit OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Hash OTP before storing
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // OTP expiration
    const expiresIn =
      Number(
        process.env.OTP_EXPIRES_MINUTES
      ) || 10;

    const expiresAt = new Date(
      Date.now() +
        expiresIn * 60 * 1000
    );

    // Store hashed OTP
    await PasswordResetOTP.create({
      email: normalizedEmail,
      otpHash,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    // Send OTP email
    await sendPasswordResetOTP(
      normalizedEmail,
      otp
    );

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a verification code has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification code. Please try again later.",
    });
  }
};

// ===============================
// VERIFY PASSWORD RESET OTP
// ===============================
const verifyPasswordResetOTP = async (
  req,
  res
) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and OTP are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const normalizedOTP = String(
      otp
    ).trim();

    // OTP must contain exactly 6 digits
    if (!/^\d{6}$/.test(normalizedOTP)) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must be a 6-digit number.",
      });
    }

    // Find OTP request
    const resetRequest =
      await PasswordResetOTP.findOne({
        email: normalizedEmail,
      });

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code is invalid or has expired.",
      });
    }

    // Check expiration
    if (
      resetRequest.expiresAt <
      new Date()
    ) {
      await PasswordResetOTP.deleteOne({
        _id: resetRequest._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code.",
      });
    }

    // Prevent OTP reuse
    if (resetRequest.verified) {
      return res.status(400).json({
        success: false,
        message:
          "This verification code has already been used.",
      });
    }

    // Maximum incorrect attempts
    const MAX_ATTEMPTS = 5;

    if (
      resetRequest.attempts >=
      MAX_ATTEMPTS
    ) {
      await PasswordResetOTP.deleteOne({
        _id: resetRequest._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new code.",
      });
    }

    // Hash submitted OTP
    const otpHash = crypto
      .createHash("sha256")
      .update(normalizedOTP)
      .digest("hex");

    // Compare OTP hashes
    if (
      otpHash !==
      resetRequest.otpHash
    ) {
      resetRequest.attempts += 1;

      await resetRequest.save();

      const remainingAttempts =
        MAX_ATTEMPTS -
        resetRequest.attempts;

      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    // OTP is correct
    resetRequest.verified = true;

    await resetRequest.save();

    // Create short-lived password reset token
    const resetToken = jwt.sign(
      {
        email: normalizedEmail,
        purpose: "password-reset",
        resetId: resetRequest._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify the OTP. Please try again later.",
    });
  }
};

// ===============================
// RESET PASSWORD
// ===============================
const resetPassword = async (
  req,
  res
) => {
  try {
    const {
      resetToken,
      newPassword,
    } = req.body;

    if (
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token and new password are required.",
      });
    }

    if (
      typeof newPassword !==
      "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be a valid string.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 8 characters.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          "Password reset session is invalid or expired. Please request a new OTP.",
      });
    }

    // Make sure token was created specifically
    // for password reset.
    if (
      decoded.purpose !==
      "password-reset"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid password reset token.",
      });
    }

    const normalizedEmail =
      decoded.email
        ?.trim()
        .toLowerCase();

    const resetId =
      decoded.resetId;

    if (
      !normalizedEmail ||
      !resetId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid password reset token.",
      });
    }

    // Find the exact verified OTP request.
    const resetRequest =
      await PasswordResetOTP.findOne({
        _id: resetId,
        email: normalizedEmail,
        verified: true,
      });

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset session is invalid or has already been used.",
      });
    }

    // Check reset session expiration
    if (
      resetRequest.expiresAt <
      new Date()
    ) {
      await PasswordResetOTP.deleteOne({
        _id: resetRequest._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Password reset session has expired. Please request a new OTP.",
      });
    }

    // Find user
    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    // Prevent using the same password
    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    // Hash new password
    user.password =
      await bcrypt.hash(
        newPassword,
        12
      );

    await user.save();

    // Delete OTP/reset session.
    // This makes the reset process one-time use.
    await PasswordResetOTP.deleteOne({
      _id: resetRequest._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password. Please try again later.",
    });
  }
};

// ===============================
// GET CURRENT USER
// ===============================
const getMe = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get me error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user profile.",
    });
  }
};

// ===============================
// UPDATE PROFILE
// ===============================
const updateProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      timezone,
      currency,
    } = req.body;

    const user = await User.findById(
      req.user.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update name
    if (name !== undefined) {
      const trimmedName =
        String(name).trim();

      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message:
            "Name must contain at least 2 characters.",
        });
      }

      if (
        trimmedName.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot exceed 100 characters.",
        });
      }

      user.name = trimmedName;
    }

    // Update timezone
    if (timezone !== undefined) {
      user.timezone =
        String(timezone).trim() ||
        "UTC";
    }

    // Update currency
    if (currency !== undefined) {
      const normalizedCurrency =
        String(currency)
          .trim()
          .toUpperCase();

      if (
        !/^[A-Z]{3}$/.test(
          normalizedCurrency
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Currency must be a valid 3-letter currency code.",
        });
      }

      user.currency =
        normalizedCurrency;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile.",
    });
  }
};

// ===============================
// CHANGE PASSWORD
// ===============================
const changePassword = async (
  req,
  res
) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 8 characters.",
      });
    }

    const user = await User.findById(
      req.user.userId
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check current password
    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    // Prevent same password
    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    // Hash new password
    user.password =
      await bcrypt.hash(
        newPassword,
        12
      );

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to change password.",
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  register,
  login,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};