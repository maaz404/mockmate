const nodemailer = require("nodemailer");
const { ENV } = require("../config/env");
const Logger = require("./logger");

let transporter = null;

/**
 * Initialize email transporter
 */
function initializeEmailTransporter() {
  if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS) {
    Logger.warn("⚠️  Email service not configured - emails will not be sent");
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_PORT === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });

    Logger.success("✅ Email transporter initialized");
    return transporter;
  } catch (error) {
    Logger.error("Failed to initialize email transporter:", error);
    return null;
  }
}

/**
 * Send verification email
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} token - Verification token
 */
async function sendVerificationEmail(email, name, token) {
  if (!transporter) {
    transporter = initializeEmailTransporter();
  }

  if (!transporter) {
    Logger.warn("Cannot send verification email - transporter not configured");
    return { success: false, error: "Email service not configured" };
  }

  const verificationUrl = `${ENV.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: ENV.EMAIL_FROM,
    to: email,
    subject: "Verify Your MockMate Account",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .button { 
              display: inline-block; 
              background: #4F46E5; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MockMate! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up! Please verify your email address to get started with MockMate.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                Or copy and paste this link in your browser:<br>
                <a href="${verificationUrl}">${verificationUrl}</a>
              </p>
              <p style="margin-top: 30px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MockMate. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    Logger.info(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    Logger.error("Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} token - Reset token
 */
async function sendPasswordResetEmail(email, name, token) {
  if (!transporter) {
    transporter = initializeEmailTransporter();
  }

  if (!transporter) {
    Logger.warn(
      "Cannot send password reset email - transporter not configured"
    );
    return { success: false, error: "Email service not configured" };
  }

  const resetUrl = `${ENV.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: ENV.EMAIL_FROM,
    to: email,
    subject: "Reset Your MockMate Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .button { 
              display: inline-block; 
              background: #4F46E5; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                Or copy and paste this link in your browser:<br>
                <a href="${resetUrl}">${resetUrl}</a>
              </p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MockMate. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    Logger.info(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    Logger.error("Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email
 * @param {string} email - User's email
 * @param {string} name - User's name
 */
async function sendWelcomeEmail(email, name) {
  if (!transporter) {
    transporter = initializeEmailTransporter();
  }

  if (!transporter) {
    Logger.warn("Cannot send welcome email - transporter not configured");
    return { success: false, error: "Email service not configured" };
  }

  const mailOptions = {
    from: ENV.EMAIL_FROM,
    to: email,
    subject: "Welcome to MockMate - Let's Get Started!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; }
            .button { 
              display: inline-block; 
              background: #4F46E5; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MockMate! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Your account has been verified and you're all set to start practicing!</p>
              
              <h3>What you can do now:</h3>
              
              <div class="feature">
                <strong>🎯 Start Your First Interview</strong><br>
                Practice with AI-powered mock interviews tailored to your role and experience level.
              </div>
              
              <div class="feature">
                <strong>💻 Coding Challenges</strong><br>
                Sharpen your programming skills with our coding interview platform.
              </div>
              
              <div class="feature">
                <strong>📊 Track Your Progress</strong><br>
                Get detailed feedback and analytics to improve your interview performance.
              </div>
              
              <p style="text-align: center;">
                <a href="${
                  ENV.CLIENT_URL
                }/dashboard" class="button">Go to Dashboard</a>
              </p>
              
              <p style="margin-top: 30px;">
                Need help? Check out our <a href="${
                  ENV.CLIENT_URL
                }/docs">documentation</a> or contact our support team.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MockMate. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    Logger.info(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    Logger.error("Failed to send welcome email:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeEmailTransporter,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
