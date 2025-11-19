const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Logger = require("../utils/logger");

class StripeService {
  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });
      Logger.info(`[Stripe] Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      Logger.error("[Stripe] Failed to create customer:", error);
      throw error;
    }
  }

  /**
   * Create a checkout session for Premium subscription
   */
  async createCheckoutSession(customerId, userId, userEmail) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_PREMIUM_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
        metadata: {
          userId,
          userEmail,
          plan: "premium",
        },
        subscription_data: {
          metadata: {
            userId,
            userEmail,
          },
        },
      });

      Logger.info(`[Stripe] Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      Logger.error("[Stripe] Failed to create checkout session:", error);
      throw error;
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckoutSession(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      Logger.error("[Stripe] Failed to retrieve session:", error);
      throw error;
    }
  }

  /**
   * Get customer portal session for subscription management
   */
  async createPortalSession(customerId) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.CLIENT_URL}/dashboard`,
      });
      return session;
    } catch (error) {
      Logger.error("[Stripe] Failed to create portal session:", error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      Logger.info(`[Stripe] Subscription canceled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      Logger.error("[Stripe] Failed to cancel subscription:", error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      Logger.error("[Stripe] Failed to retrieve subscription:", error);
      throw error;
    }
  }

  /**
   * Update subscription (e.g., change plan)
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await stripe.subscriptions.update(
        subscriptionId,
        updates
      );
      Logger.info(`[Stripe] Subscription updated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      Logger.error("[Stripe] Failed to update subscription:", error);
      throw error;
    }
  }

  /**
   * Construct webhook event
   */
  constructWebhookEvent(payload, signature) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return event;
    } catch (error) {
      Logger.error("[Stripe] Webhook signature verification failed:", error);
      throw error;
    }
  }
}

module.exports = new StripeService();
