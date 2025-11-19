# Stripe Payment Integration - Complete Implementation Guide

## 📋 Overview

MockMate now includes a complete Stripe payment integration with two subscription tiers:

- **Free Plan**: 5 interviews per month
- **Premium Plan**: Unlimited interviews ($29.99/month recommended)

## ✅ What's Been Implemented

### Backend (100% Complete)

- ✅ Stripe service layer (`server/src/services/stripeService.js`)
- ✅ Payment controller with webhook handling (`server/src/controllers/paymentController.js`)
- ✅ Payment routes (`server/src/routes/payment.js`)
- ✅ Routes registered in `server.js`
- ✅ Webhook signature verification
- ✅ Subscription lifecycle management
- ✅ Stripe SDK installed

### Frontend (100% Complete)

- ✅ Pricing page component (`client/src/components/payment/PricingPage.js`)
- ✅ Payment success page (`client/src/components/payment/PaymentSuccess.js`)
- ✅ Payment cancel page (`client/src/components/payment/PaymentCancel.js`)
- ✅ Subscription banner component (`client/src/components/payment/SubscriptionBanner.js`)
- ✅ Routes configured in `AppRoutes.js`
- ✅ Stripe frontend libraries installed

### Documentation

- ✅ Comprehensive setup guide (`STRIPE_SETUP_GUIDE.md`)
- ✅ Environment configuration examples (`.env.stripe.example`)
- ✅ This implementation guide

## 🚀 Quick Start (5 Steps)

### Step 1: Set Up Stripe Account

1. Create a Stripe account at https://dashboard.stripe.com/register
2. Get your API keys from https://dashboard.stripe.com/apikeys
   - Copy **Secret key** (starts with `sk_test_`)
   - Copy **Publishable key** (starts with `pk_test_`)

### Step 2: Create Premium Product

1. Go to https://dashboard.stripe.com/products
2. Click **"Add Product"**
3. Fill in details:
   - **Name**: MockMate Premium
   - **Description**: Unlimited mock interviews with advanced AI feedback
   - **Pricing**: Recurring
   - **Price**: $29.99 USD (or your choice)
   - **Billing period**: Monthly
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_`)

### Step 3: Configure Environment Variables

**Server (.env):**

```bash
# Copy from .env.stripe.example and fill in your values
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_PREMIUM_PRICE_ID=price_your_actual_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:3000
```

**Client (.env):**

```bash
# Copy from .env.stripe.example
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
REACT_APP_API_URL=http://localhost:5000
```

### Step 4: Set Up Webhook (for local testing)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli#install
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
4. Copy the webhook signing secret from terminal output (starts with `whsec_`)
5. Update `STRIPE_WEBHOOK_SECRET` in server `.env`

### Step 5: Test the Integration

1. Start your servers:

   ```bash
   # Terminal 1 - Backend
   cd server
   npm start

   # Terminal 2 - Frontend
   cd client
   npm start

   # Terminal 3 - Stripe CLI (for webhook testing)
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```

2. Navigate to http://localhost:3000/pricing
3. Click **"Upgrade to Premium"**
4. Use test card: **4242 4242 4242 4242**
   - Expiration: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Complete checkout
6. Verify you're redirected to success page
7. Check dashboard - you should now have Premium status

## 🔄 Payment Flow

```
User clicks "Upgrade to Premium"
    ↓
POST /api/payments/create-checkout-session
    ↓
Stripe Checkout Session created
    ↓
User redirected to Stripe Checkout
    ↓
User completes payment
    ↓
Stripe sends webhook: checkout.session.completed
    ↓
Server verifies webhook signature
    ↓
Server updates user subscription in database
    ↓
User redirected to /payment/success
    ↓
Frontend verifies session
    ↓
User redirected to dashboard with Premium access
```

## 📁 File Structure

```
server/
├── src/
│   ├── services/
│   │   └── stripeService.js         # Stripe API wrapper
│   ├── controllers/
│   │   └── paymentController.js     # Payment endpoints + webhooks
│   ├── routes/
│   │   └── payment.js               # Payment routes
│   └── server.js                     # Routes registered here
└── .env.stripe.example               # Environment template

client/
├── src/
│   ├── components/
│   │   └── payment/
│   │       ├── PricingPage.js       # Main pricing page
│   │       ├── PaymentSuccess.js    # Success redirect page
│   │       ├── PaymentCancel.js     # Cancel redirect page
│   │       └── SubscriptionBanner.js # Low interviews warning
│   └── routes/
│       └── AppRoutes.js             # Routes configured here
└── .env.stripe.example              # Environment template

docs/
└── STRIPE_SETUP_GUIDE.md            # Comprehensive setup guide
```

## 🎯 Available Endpoints

### Public Endpoints

- `POST /api/payments/webhook` - Stripe webhook handler (raw body)

### Protected Endpoints (require auth token)

- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `GET /api/payments/verify-session?session_id=xxx` - Verify payment
- `POST /api/payments/create-portal-session` - Manage subscription
- `POST /api/payments/cancel-subscription` - Cancel subscription

## 📱 Frontend Pages

### Pricing Page (`/pricing`)

- Shows Free vs Premium comparison
- Displays current plan and interviews remaining
- "Upgrade to Premium" button
- "Manage Subscription" for existing premium users
- FAQ section

### Success Page (`/payment/success`)

- Verifies payment with backend
- Shows success message
- Auto-redirects to dashboard after 3 seconds

### Cancel Page (`/payment/cancel`)

- Shown when user cancels checkout
- Options to retry or return to dashboard

### Subscription Banner (Component)

- Shows warning when ≤2 interviews remaining
- Urgent alert when 0 interviews left
- Add to dashboard or other pages:

  ```jsx
  import SubscriptionBanner from "../components/payment/SubscriptionBanner";

  function Dashboard() {
    return (
      <div>
        <SubscriptionBanner />
        {/* rest of dashboard */}
      </div>
    );
  }
  ```

## 🔐 Security Features

- ✅ Webhook signature verification
- ✅ Protected endpoints with JWT authentication
- ✅ Raw body parser for webhook endpoint only
- ✅ Environment variable configuration
- ✅ Error handling and logging
- ✅ Idempotency for webhook events

## 🧪 Testing

### Test Cards

```
Success:           4242 4242 4242 4242
Decline:           4000 0000 0000 0002
Requires Auth:     4000 0027 6000 3184
Insufficient:      4000 0000 0000 9995
```

### Test Scenarios

1. **New Subscription**: Free → Premium upgrade
2. **Payment Success**: Verify webhook updates database
3. **Payment Failure**: Verify error handling
4. **Cancel Subscription**: Test downgrade flow
5. **Manage Subscription**: Test portal session
6. **Interview Quota**: Verify limits enforced

## 🐛 Troubleshooting

### Webhook not receiving events

- Verify Stripe CLI is running: `stripe listen --forward-to localhost:5000/api/payments/webhook`
- Check webhook secret matches terminal output
- Verify server is running on port 5000
- Check server logs for webhook errors

### "Invalid signature" error

- Webhook secret doesn't match
- Body parser interfering (webhook route should use raw parser)
- Re-copy webhook secret from Stripe CLI or Dashboard

### Checkout session not creating

- Verify `STRIPE_SECRET_KEY` is set
- Verify `STRIPE_PREMIUM_PRICE_ID` is correct
- Check user is authenticated (JWT token present)
- Check server logs for detailed error

### Payment succeeds but subscription not updated

- Check webhook is configured correctly
- Verify `checkout.session.completed` event is being listened to
- Check database connection
- Review webhook logs in Stripe Dashboard

## 🌐 Production Deployment

### 1. Update Environment Variables

```bash
# Server production .env
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_PREMIUM_PRICE_ID=price_your_live_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_production_secret
FRONTEND_URL=https://yourdomain.com

# Client production .env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
REACT_APP_API_URL=https://api.yourdomain.com
```

### 2. Configure Production Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://api.yourdomain.com/api/payments/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret
6. Update `STRIPE_WEBHOOK_SECRET` in production environment

### 3. SSL Certificate Required

- Stripe requires HTTPS for production webhooks
- Ensure your domain has valid SSL certificate

### 4. Test in Production

- Use real card or Stripe test mode
- Verify webhooks are received
- Monitor Stripe Dashboard logs

## 📊 Monitoring

### Stripe Dashboard

- View payments: https://dashboard.stripe.com/payments
- View subscriptions: https://dashboard.stripe.com/subscriptions
- View webhook logs: https://dashboard.stripe.com/webhooks
- View customers: https://dashboard.stripe.com/customers

### Application Logs

- Server logs show webhook processing
- Check for "Webhook processed successfully" messages
- Monitor payment errors and failures

## 🎨 Customization

### Change Pricing

1. Update price in Stripe Dashboard product
2. Update displayed price in `PricingPage.js` (line 22)
3. Update recommended price in `STRIPE_SETUP_GUIDE.md`

### Add More Features to Premium

1. Update features list in `PricingPage.js` (lines 25-34)
2. Implement feature gating in your code:
   ```javascript
   if (user.subscription?.plan !== "premium") {
     // Show upgrade prompt
   }
   ```

### Custom Styling

- Pricing page uses Tailwind CSS
- Customize colors in `PricingPage.js`
- Match your brand colors

## 📚 Additional Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Testing Guide**: https://stripe.com/docs/testing
- **Webhook Events**: https://stripe.com/docs/api/events/types
- **Checkout Sessions**: https://stripe.com/docs/payments/checkout

## ✨ Next Steps

1. **Add Analytics**: Track conversion rates, popular plans
2. **Email Notifications**: Send receipts, subscription updates
3. **Annual Plans**: Add yearly billing option (20% discount)
4. **Team Plans**: Add team/enterprise tiers
5. **Coupon Codes**: Implement discount codes
6. **Trial Period**: Add 7-day free trial for Premium
7. **Usage Alerts**: Email when approaching interview limit
8. **Subscription Metrics**: Dashboard for subscription health

## 🤝 Support

If you encounter issues:

1. Check this guide first
2. Review `STRIPE_SETUP_GUIDE.md` for detailed setup
3. Check Stripe Dashboard webhook logs
4. Review server console logs
5. Verify all environment variables are set

---

**Implementation Status**: ✅ COMPLETE - Ready for testing!

**Last Updated**: December 2024
