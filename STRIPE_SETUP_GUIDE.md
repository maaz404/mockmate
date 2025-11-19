# 🚀 Stripe Integration Setup Guide

## Overview

This guide will help you integrate Stripe payments into MockMate with two subscription tiers:

- **Free Plan**: 5 interviews/month
- **Premium Plan**: Unlimited interviews + all features

## 📋 Prerequisites

1. **Stripe Account**: Sign up at https://stripe.com
2. **Get Your API Keys**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your `Publishable key` and `Secret key`

## 🔧 Step 1: Install Dependencies

```bash
# In server directory
cd server
npm install stripe

# In client directory
cd ../client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## 🔑 Step 2: Environment Variables

Add to your `.env` file in the **server** directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Premium Plan Price ID (create this in Stripe Dashboard)
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here

# Client URL for redirects
CLIENT_URL=http://localhost:3000
```

Add to your `.env` file in the **client** directory:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## 💰 Step 3: Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/products
2. Click "**+ Add product**"

### Create Premium Plan:

- **Name**: MockMate Premium
- **Description**: Unlimited mock interviews with advanced features
- **Pricing**:
  - **Price**: $29.99 (or your preferred amount)
  - **Billing period**: Monthly (recurring)
  - **Currency**: USD
- Click "**Save product**"
- **Copy the Price ID** (starts with `price_xxx`) and add it to your `.env` as `STRIPE_PREMIUM_PRICE_ID`

## 🎯 Step 4: Configure Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "**+ Add endpoint**"
3. **Endpoint URL**: `http://localhost:5000/api/payments/webhook` (for local testing)
   - For production: `https://yourdomain.com/api/payments/webhook`
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "**Add endpoint**"
6. **Copy the Signing secret** (starts with `whsec_xxx`) and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

## 🧪 Step 5: Test Webhook Locally (Using Stripe CLI)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:5000/api/payments/webhook

# This will give you a webhook signing secret, add it to your .env
```

## 🧪 Test Cards

Use these test card numbers in Stripe:

| Card Number         | Description             |
| ------------------- | ----------------------- |
| 4242 4242 4242 4242 | Successful payment      |
| 4000 0000 0000 9995 | Declined card           |
| 4000 0025 0000 3155 | Requires authentication |

- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## 📊 Pricing Recommendation

### Free Plan (Current)

- ✅ 5 mock interviews per month
- ✅ Basic AI feedback
- ✅ Video recording
- ✅ Question bank access
- ❌ Advanced analytics
- ❌ Custom question generation
- ❌ Coding challenges
- ❌ Export results (PDF/CSV)

### Premium Plan - $29.99/month

- ✅ **Unlimited** mock interviews
- ✅ Advanced AI feedback with insights
- ✅ Video recording & playback
- ✅ Full question bank access
- ✅ Advanced performance analytics
- ✅ Custom AI-generated questions
- ✅ Coding challenges with Judge0
- ✅ Export results (PDF/CSV)
- ✅ Priority support
- ✅ Interview scheduling
- ✅ Performance trends

## 🚀 Step 6: Start Your Application

```bash
# Start server (with new routes)
cd server
npm start

# Start client (with new payment components)
cd client
npm start
```

## 🧭 User Flow

1. User signs up → Gets **Free Plan** (5 interviews/month)
2. User clicks "**Upgrade to Premium**" on dashboard
3. Redirected to Stripe Checkout
4. After payment → Subscription activated
5. User returns to app with **Premium Plan** (unlimited interviews)

## 🔄 Testing the Integration

### Test Upgrade Flow:

1. Login as a user
2. Go to `/pricing` or click "Upgrade" button
3. Click "Subscribe to Premium"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify subscription in dashboard
7. Test unlimited interviews

### Test Webhook:

1. Complete a payment
2. Check server logs for webhook events
3. Verify subscription status updated in database
4. Check user profile shows Premium plan

## 📱 Production Checklist

Before going live:

- [ ] Switch to **Live mode** in Stripe Dashboard
- [ ] Update `.env` with live API keys
- [ ] Create live products and prices
- [ ] Update webhook endpoint to production URL
- [ ] Test with real payment methods
- [ ] Set up Stripe billing portal for subscription management
- [ ] Configure email receipts in Stripe
- [ ] Set up subscription renewal notifications
- [ ] Test cancellation and refund flows

## 🆘 Common Issues

### Issue: Webhook not receiving events

**Solution**: Make sure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret

### Issue: "No such price" error

**Solution**: Verify `STRIPE_PREMIUM_PRICE_ID` is correct and exists in your Stripe account

### Issue: Payment succeeds but subscription not activated

**Solution**: Check webhook logs, ensure events are being received and processed

### Issue: CORS errors in browser

**Solution**: Verify `CLIENT_URL` is set correctly in server `.env`

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe React SDK](https://stripe.com/docs/stripe-js/react)

## 💡 Future Enhancements

- Annual billing option (offer 2 months free)
- Team/Enterprise plans
- Referral discounts
- Promo codes
- Grace period for failed payments
- Usage-based billing
- Add-on features (extra coaching sessions, etc.)

---

**Need Help?** Check the implementation files or contact support.
