const nodemailer = require("nodemailer");
const Logger = require("./logger");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    Logger.error("SMTP connection error:", error);
  } else {
    Logger.info("SMTP server is ready to send emails");
  }
});

async function sendMail({ to, subject, html }) {
  try {
    Logger.info(`Attempting to send email to: ${to}`);
    const info = await transporter.sendMail({
      from: `"MockMate" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    Logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    Logger.error("Email sending failed:", error);
    throw error;
  }
}

module.exports = { sendMail };
