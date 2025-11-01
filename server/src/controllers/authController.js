const User = require("../models/User");
const crypto = require("crypto");

/**
 * @desc    Forgot password - Send reset token via email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return success even if user not found (security best practice)
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link",
      });
    }

    // Only allow password reset for local auth users
    if (user.authProvider !== "local") {
      return res.status(400).json({
        success: false,
        message: "Password reset is only available for email/password accounts. Please sign in with Google.",
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // TODO: Send email with reset link
    // For now, we'll just return the token (in production, send via email)
    const message = `You requested a password reset. Please visit: ${resetUrl}`;

    try {
      // In production, use a proper email service like nodemailer
      // await sendEmail({
      //   email: user.email,
      //   subject: 'Password Reset Request',
      //   message
      // });

      // For development, log the reset URL
      if (process.env.NODE_ENV === "development") {
        console.log("Password Reset URL:", resetUrl);
      }

      res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link",
        // Only include resetToken in development
        ...(process.env.NODE_ENV === "development" && { resetToken, resetUrl }),
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Reset password using token
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Please provide a password with at least 8 characters",
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get current logged in user (JWT-based)
 * @route   GET /api/auth/me-jwt
 * @access  Private (JWT token required)
 */
exports.getMeJWT = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        authProvider: user.authProvider,
        subscription: user.subscription,
        analytics: user.analytics,
      },
    });
  } catch (error) {
    console.error("Get me JWT error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
