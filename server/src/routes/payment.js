const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const {
  createCheckoutSession,
  verifyCheckoutSession,
  createPortalSession,
  cancelSubscription,
  handleWebhook,
} = require("../controllers/paymentController");

// Public routes
// Webhook endpoint (must use raw body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// Protected routes
router.post("/create-checkout-session", requireAuth, createCheckoutSession);
router.get("/verify-session", requireAuth, verifyCheckoutSession);
router.post("/create-portal-session", requireAuth, createPortalSession);
router.post("/cancel-subscription", requireAuth, cancelSubscription);

module.exports = router;
