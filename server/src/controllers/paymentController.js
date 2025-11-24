const UserProfile = require("../models/UserProfile");
const stripeService = require("../services/stripeService");
const Logger = require("../utils/logger");
const { ok, fail } = require("../utils/responder");

/**
 * Create a checkout session for Premium subscription
 */
const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    const profile = await UserProfile.findOne({ user: userId }).populate(
      "user"
    );
    if (!profile) {
      return fail(res, 404, "NOT_FOUND", "User profile not found");
    }

    // Check if already premium
    if (profile.subscription.plan === "premium") {
      return fail(res, 400, "ALREADY_PREMIUM", "Already subscribed to Premium");
    }

    const user = profile.user;
    let customerId = profile.subscription.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripeService.createCustomer(
        user.email,
        user.name || "MockMate User",
        {
          userId: userId.toString(),
          clerkId: user.clerkId || "",
        }
      );
      customerId = customer.id;
      profile.subscription.stripeCustomerId = customerId;
      await profile.save();
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      customerId,
      userId.toString(),
      user.email
    );

    Logger.info(`[Payment] Checkout session created for user ${userId}`);
    return ok(res, { sessionId: session.id, url: session.url });
  } catch (error) {
    Logger.error("[Payment] Failed to create checkout session:", error);
    Logger.error("[Payment] Error details:", error.message);
    if (error.raw) {
      Logger.error("[Payment] Stripe error:", error.raw);
    }
    return fail(
      res,
      500,
      "CHECKOUT_FAILED",
      error.message || "Failed to create checkout session"
    );
  }
};

/**
 * Verify checkout session and update subscription
 */
const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id;

    if (!sessionId) {
      return fail(res, 400, "MISSING_SESSION_ID", "Session ID required");
    }

    const session = await stripeService.getCheckoutSession(sessionId);

    if (session.payment_status !== "paid") {
      return fail(res, 400, "PAYMENT_NOT_COMPLETED", "Payment not completed");
    }

    // Update user profile if userId matches
    if (userId && session.metadata?.userId === userId.toString()) {
      const profile = await UserProfile.findOne({ user: userId });
      if (profile) {
        profile.subscription.plan = "premium";
        profile.subscription.status = "active";
        profile.subscription.stripeSubscriptionId = session.subscription;
        profile.subscription.interviewsRemaining = null; // Unlimited
        profile.subscription.startDate = new Date();
        await profile.save();

        Logger.info(`[Payment] Premium activated for user ${userId}`);
      }
    }

    return ok(res, {
      success: true,
      subscription: {
        plan: "premium",
        status: "active",
      },
    });
  } catch (error) {
    Logger.error("[Payment] Failed to verify checkout session:", error);
    return fail(res, 500, "VERIFICATION_FAILED", "Failed to verify payment");
  }
};

/**
 * Get customer portal session for subscription management
 */
const createPortalSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile || !profile.subscription.stripeCustomerId) {
      return fail(res, 404, "NO_SUBSCRIPTION", "No active subscription found");
    }

    const session = await stripeService.createPortalSession(
      profile.subscription.stripeCustomerId
    );

    return ok(res, { url: session.url });
  } catch (error) {
    Logger.error("[Payment] Failed to create portal session:", error);
    return fail(res, 500, "PORTAL_FAILED", "Failed to create portal session");
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile || !profile.subscription.stripeSubscriptionId) {
      return fail(res, 404, "NO_SUBSCRIPTION", "No active subscription found");
    }

    await stripeService.cancelSubscription(
      profile.subscription.stripeSubscriptionId
    );

    // Update profile - keep premium until end of billing period
    profile.subscription.status = "canceled";
    profile.subscription.canceledAt = new Date();
    await profile.save();

    Logger.info(`[Payment] Subscription canceled for user ${userId}`);
    return ok(res, { message: "Subscription canceled successfully" });
  } catch (error) {
    Logger.error("[Payment] Failed to cancel subscription:", error);
    return fail(res, 500, "CANCEL_FAILED", "Failed to cancel subscription");
  }
};

/**
 * Handle Stripe webhooks
 */
const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  try {
    const event = stripeService.constructWebhookEvent(req.body, signature);

    Logger.info(`[Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        Logger.info(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    Logger.error("[Webhook] Error processing webhook:", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// ========== Webhook Handlers ==========

async function handleCheckoutCompleted(session) {
  try {
    const userId = session.metadata?.userId;
    if (!userId) {
      Logger.warn("[Webhook] No userId in checkout session metadata");
      return;
    }

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) {
      Logger.warn(`[Webhook] Profile not found for user ${userId}`);
      return;
    }

    // Idempotency check: skip if already premium with same subscription ID
    if (
      profile.subscription.plan === "premium" &&
      profile.subscription.stripeSubscriptionId === session.subscription
    ) {
      Logger.info(
        `[Webhook] Premium already activated for user ${userId}, skipping duplicate`
      );
      return;
    }

    profile.subscription.plan = "premium";
    profile.subscription.status = "active";
    profile.subscription.stripeCustomerId = session.customer;
    profile.subscription.stripeSubscriptionId = session.subscription;
    profile.subscription.interviewsRemaining = null; // Unlimited
    profile.subscription.startDate = new Date();
    await profile.save();

    Logger.info(`[Webhook] Premium activated for user ${userId}`);
  } catch (error) {
    Logger.error("[Webhook] Error in handleCheckoutCompleted:", error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      Logger.warn("[Webhook] No userId in subscription metadata");
      return;
    }

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) {
      Logger.warn(`[Webhook] Profile not found for user ${userId}`);
      return;
    }

    // Update subscription status from Stripe
    profile.subscription.status = subscription.status;
    profile.subscription.currentPeriodEnd = new Date(
      subscription.current_period_end * 1000
    );

    // Only set to premium if subscription is in good standing
    if (["active", "trialing"].includes(subscription.status)) {
      profile.subscription.plan = "premium";
      profile.subscription.interviewsRemaining = null;
    } else if (
      ["canceled", "incomplete_expired", "unpaid"].includes(subscription.status)
    ) {
      // Downgrade to free if subscription is terminated
      profile.subscription.plan = "free";
      profile.subscription.interviewsRemaining = 10;
    }
    // For past_due, incomplete, paused - keep current plan but update status

    await profile.save();
    Logger.info(
      `[Webhook] Subscription updated for user ${userId}, status: ${subscription.status}`
    );
  } catch (error) {
    Logger.error("[Webhook] Error in handleSubscriptionUpdate:", error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      Logger.warn("[Webhook] No userId in subscription metadata");
      return;
    }

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) {
      Logger.warn(`[Webhook] Profile not found for user ${userId}`);
      return;
    }

    // Downgrade to free plan
    profile.subscription.plan = "free";
    profile.subscription.status = "canceled";
    profile.subscription.interviewsRemaining = 5; // Free plan quota
    profile.subscription.nextResetDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    await profile.save();

    Logger.info(
      `[Webhook] Subscription deleted, user ${userId} downgraded to free`
    );
  } catch (error) {
    Logger.error("[Webhook] Error in handleSubscriptionDeleted:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer;
    const profile = await UserProfile.findOne({
      "subscription.stripeCustomerId": customerId,
    });

    if (!profile) {
      Logger.warn(`[Webhook] Profile not found for customer ${customerId}`);
      return;
    }

    // Ensure subscription remains active
    profile.subscription.status = "active";
    profile.subscription.lastPaymentDate = new Date();
    await profile.save();

    Logger.info(
      `[Webhook] Invoice payment succeeded for customer ${customerId}`
    );
  } catch (error) {
    Logger.error("[Webhook] Error in handleInvoicePaymentSucceeded:", error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const customerId = invoice.customer;
    const profile = await UserProfile.findOne({
      "subscription.stripeCustomerId": customerId,
    });

    if (!profile) {
      Logger.warn(`[Webhook] Profile not found for customer ${customerId}`);
      return;
    }

    profile.subscription.status = "past_due";
    await profile.save();

    Logger.warn(`[Webhook] Invoice payment failed for customer ${customerId}`);
    // TODO: Send email notification to user
  } catch (error) {
    Logger.error("[Webhook] Error in handleInvoicePaymentFailed:", error);
  }
}

module.exports = {
  createCheckoutSession,
  verifyCheckoutSession,
  createPortalSession,
  cancelSubscription,
  handleWebhook,
};
