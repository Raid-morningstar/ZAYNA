# Zayna

Zayna e-commerce.

## Card Payment Setup (Stripe)

Card checkout is already implemented in code. To make it work, configure environment variables and Stripe webhook.

### 1. Configure environment variables

1. Copy `.env.example` to `.env.local`.
2. Fill all values, especially:
   - `NEXT_PUBLIC_BASE_URL`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - Clerk and Sanity variables

For local development:
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`

### 2. Run app

```bash
npm run dev
```

### 3. Start Stripe webhook forwarding (local)

Install Stripe CLI, login, then run:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Stripe CLI prints a signing secret (`whsec_...`). Put that value into:
- `STRIPE_WEBHOOK_SECRET`

### 4. Test card payment

1. Open cart page.
2. Choose `Card Payment (Stripe)`.
3. Click checkout.
4. You are redirected to Stripe Checkout (secure hosted payment page).
5. Use Stripe test card `4242 4242 4242 4242` with any future expiry, any CVC, any ZIP.

## Where card information is entered and stored

- Card details are entered on Stripe Checkout, not inside this app UI.
- This app does **not** store raw card number, expiry, or CVC.
- After payment success, webhook stores order-level references in Sanity:
  - `stripeCheckoutSessionId`
  - `stripePaymentIntentId`
  - `stripeCustomerId`
  - payment metadata (method/status/amount/order items/address)

Relevant code paths:
- Checkout session creation: `actions/createCheckoutSession.ts`
- Webhook processing and order creation: `app/(client)/api/webhook/route.ts`
- Stripe client setup: `lib/stripe.ts`
