# Maly Stripe Financial Flow

## Overview

Maly uses Stripe for all payment processing, including event ticket sales and premium subscriptions. Event hosts receive payouts through Stripe Connect with a 3% platform fee.

---

## Financial Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MALY FINANCIAL ECOSYSTEM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   EVENT BUYER   │
                              │    (Customer)   │
                              └────────┬────────┘
                                       │
                                       │ 1. Purchases ticket
                                       │    ($50 example)
                                       ▼
                              ┌─────────────────┐
                              │  STRIPE CHECKOUT│
                              │     SESSION     │
                              └────────┬────────┘
                                       │
                                       │ 2. Payment processed
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        │                              ▼                              │
        │                    ┌─────────────────┐                      │
        │                    │     STRIPE      │                      │
        │                    │    PLATFORM     │                      │
        │                    │   (Maly Account)│                      │
        │                    └────────┬────────┘                      │
        │                             │                               │
        │              ┌──────────────┴──────────────┐               │
        │              │                             │                │
        │              ▼                             ▼                │
        │    ┌─────────────────┐          ┌─────────────────┐        │
        │    │  PLATFORM FEE   │          │   HOST PAYOUT   │        │
        │    │     (3%)        │          │     (97%)       │        │
        │    │    $1.50        │          │    $48.50       │        │
        │    └─────────────────┘          └────────┬────────┘        │
        │              │                           │                  │
        │              │                           │                  │
        │              ▼                           ▼                  │
        │    ┌─────────────────┐          ┌─────────────────┐        │
        │    │  MALY REVENUE   │          │  HOST STRIPE    │        │
        │    │    ACCOUNT      │          │  EXPRESS ACCOUNT│        │
        │    └─────────────────┘          └────────┬────────┘        │
        │                                          │                  │
        │                                          │ Automatic        │
        │                                          │ Bank Transfer    │
        │                                          ▼                  │
        │                                 ┌─────────────────┐        │
        │                                 │   HOST BANK     │        │
        │                                 │    ACCOUNT      │        │
        │                                 └─────────────────┘        │
        │                                                             │
        └─────────────────────────────────────────────────────────────┘
```

---

## Stripe Connect Architecture

### Account Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STRIPE CONNECT SETUP                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────────────────┐
                    │         MALY PLATFORM             │
                    │      (Stripe Platform Account)    │
                    │                                   │
                    │  • Manages all transactions       │
                    │  • Collects platform fees         │
                    │  • Handles refunds                │
                    └───────────────────┬───────────────┘
                                        │
                                        │ Creates & manages
                                        ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                    CONNECTED ACCOUNTS                        │
        │                   (Express Account Type)                     │
        │                                                              │
        │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
        │  │   Host #1   │  │   Host #2   │  │   Host #3   │  ...    │
        │  │  acct_xxx   │  │  acct_yyy   │  │  acct_zzz   │         │
        │  └─────────────┘  └─────────────┘  └─────────────┘         │
        │                                                              │
        │  Each host has:                                              │
        │  • Own Stripe Express account                                │
        │  • Direct bank account connection                            │
        │  • Tax information management                                │
        │  • Payout schedule control                                   │
        └─────────────────────────────────────────────────────────────┘
```

### Host Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOST ONBOARDING FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   Host      │────▶│ Click "Get Paid"│────▶│ POST /api/stripe/   │
│   User      │     │ Button          │     │ connect/create-     │
└─────────────┘     └─────────────────┘     │ account             │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Stripe Creates      │
                                            │ Express Account     │
                                            │ (acct_xxxx)         │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Save stripeAccountId│
                                            │ to users table      │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   Host      │◀────│ Redirect to     │◀────│ POST /api/stripe/   │
│   User      │     │ Stripe Onboard  │     │ connect/create-     │
└─────────────┘     │ URL             │     │ account-link        │
                    └─────────────────┘     └─────────────────────┘

        ... Host completes Stripe onboarding ...
        ... Enters bank details, tax info, identity verification ...

┌─────────────────────────────────────────────────────────────────────────────┐
│                     ONBOARDING COMPLETION                                    │
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐   │
│  │ Stripe Webhook  │────▶│ account.updated │────▶│ Check completion:   │   │
│  │ Received        │     │ Event           │     │ • details_submitted │   │
│  └─────────────────┘     └─────────────────┘     │ • charges_enabled   │   │
│                                                   │ • no currently_due  │   │
│                                                   └──────────┬──────────┘   │
│                                                              │              │
│                                                              ▼              │
│                                                   ┌─────────────────────┐   │
│                                                   │ Update user:        │   │
│                                                   │ stripeOnboarding    │   │
│                                                   │ Complete = true     │   │
│                                                   └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Ticket Purchase Flow

### Checkout Session Creation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TICKET PURCHASE FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   Buyer     │────▶│ Click "Buy      │────▶│ POST /api/payments/ │
│             │     │ Ticket" ($50)   │     │ create-checkout-    │
└─────────────┘     └─────────────────┘     │ session             │
                                            └──────────┬──────────┘
                                                       │
                    ┌──────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHECKOUT SESSION CREATION                                 │
│                                                                              │
│  1. Validate event exists and has tickets available                         │
│  2. Get event creator's Stripe account ID                                   │
│  3. Verify creator's Stripe onboarding is complete                          │
│  4. Calculate application fee (3%)                                          │
│                                                                              │
│  const session = await stripe.checkout.sessions.create({                    │
│    payment_method_types: ['card'],                                          │
│    line_items: [{                                                           │
│      price_data: {                                                          │
│        currency: 'usd',                                                     │
│        product_data: { name: 'Beach Party Ticket' },                        │
│        unit_amount: 5000, // $50.00 in cents                                │
│      },                                                                     │
│      quantity: 1,                                                           │
│    }],                                                                      │
│    mode: 'payment',                                                         │
│    payment_intent_data: {                                                   │
│      application_fee_amount: 150, // 3% = $1.50                             │
│      transfer_data: {                                                       │
│        destination: 'acct_hostStripeId', // Host's account                  │
│      },                                                                     │
│    },                                                                       │
│    success_url: 'https://app/payment-success?session_id={...}',             │
│    cancel_url: 'https://app/payment-cancel',                                │
│    metadata: {                                                              │
│      eventId: '123',                                                        │
│      userId: '456',                                                         │
│    },                                                                       │
│  });                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Return session.url  │
                                            │ for redirect        │
                                            └─────────────────────┘
```

### Payment Processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT PROCESSING                                        │
└─────────────────────────────────────────────────────────────────────────────┘

           ┌─────────────────────────────────────────────────────┐
           │              STRIPE CHECKOUT PAGE                    │
           │                                                      │
           │   ┌────────────────────────────────────────────┐    │
           │   │  Beach Party Ticket              $50.00   │    │
           │   └────────────────────────────────────────────┘    │
           │                                                      │
           │   Card: [4242 4242 4242 4242]                       │
           │   Exp:  [12/25]  CVC: [123]                         │
           │                                                      │
           │   [        Pay $50.00        ]                       │
           └─────────────────────────────────────────────────────┘
                                    │
                                    │ Payment Submitted
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STRIPE PROCESSES PAYMENT                                  │
│                                                                              │
│   1. Charge customer's card: $50.00                                         │
│   2. Stripe processing fee: ~$1.75 (2.9% + $0.30)                           │
│   3. Deduct application fee: $1.50 (3% to Maly)                             │
│   4. Transfer remainder to host: $46.75                                     │
│                                                                              │
│   Money Flow:                                                                │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │ Customer Pays     │ Stripe Fee │ Maly Fee │ Host Receives         │    │
│   │     $50.00        │   $1.75    │  $1.50   │    $46.75             │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ checkout.session.completed
                                    ▼
                           ┌─────────────────────┐
                           │   WEBHOOK EVENT     │
                           │   POST /api/webhooks│
                           │   /stripe           │
                           └─────────────────────┘
```

### Webhook Processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK PROCESSING                                        │
└─────────────────────────────────────────────────────────────────────────────┘

POST /api/webhooks/stripe
Body: Stripe Event (checkout.session.completed)

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. Verify webhook signature                                                 │
│     stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)        │
│                                                                              │
│  2. Extract session data                                                     │
│     • eventId from metadata                                                  │
│     • userId from metadata                                                   │
│     • amount_total from session                                              │
│     • payment_intent from session                                            │
│                                                                              │
│  3. Create payment record                                                    │
│     INSERT INTO payments (                                                   │
│       userId, stripeCheckoutSessionId, amount, status, ...                  │
│     )                                                                        │
│                                                                              │
│  4. Create/update event participant                                          │
│     INSERT INTO event_participants (                                         │
│       eventId, userId, status='attending', paymentStatus='completed'        │
│     )                                                                        │
│                                                                              │
│  5. Generate unique ticket code                                              │
│     ticketIdentifier = uuid()                                                │
│                                                                              │
│  6. Update available tickets                                                 │
│     UPDATE events SET availableTickets = availableTickets - 1               │
│                                                                              │
│  7. Send push notification to buyer                                          │
│     "Your ticket for Beach Party has been confirmed!"                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Premium Subscription Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PREMIUM SUBSCRIPTION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   User      │────▶│ Select Plan     │────▶│ POST /api/premium/  │
│             │     │ Monthly: $29    │     │ create-checkout     │
│             │     │ Yearly: $290    │     │                     │
└─────────────┘     └─────────────────┘     └──────────┬──────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION CHECKOUT                                     │
│                                                                              │
│  const session = await stripe.checkout.sessions.create({                    │
│    payment_method_types: ['card'],                                          │
│    line_items: [{                                                           │
│      price_data: {                                                          │
│        currency: 'usd',                                                     │
│        product_data: { name: 'Maly Premium Monthly' },                      │
│        unit_amount: 2900, // $29.00                                         │
│        recurring: { interval: 'month' },                                    │
│      },                                                                     │
│      quantity: 1,                                                           │
│    }],                                                                      │
│    mode: 'subscription',                                                    │
│    success_url: '.../premium-success?session_id={...}',                     │
│    cancel_url: '.../premium?canceled=true',                                 │
│    client_reference_id: userId,                                             │
│  });                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                                       │
                    ┌──────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POST-PAYMENT VERIFICATION                                 │
│                                                                              │
│  GET /api/premium/verify-checkout?session_id=cs_xxx                         │
│                                                                              │
│  1. Retrieve checkout session from Stripe                                    │
│  2. Verify payment_status === 'paid'                                        │
│  3. Update user: isPremium = true                                           │
│  4. Create subscription record in database                                   │
│  5. Return success to frontend                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                    RECURRING BILLING
                    ─────────────────
                    
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Day 1   │ Day 30  │ Day 60  │ Day 90  │ ...                               │
│  ────────┼─────────┼─────────┼─────────┼─────                              │
│  $29     │ $29     │ $29     │ $29     │                                   │
│  ▲       │ ▲       │ ▲       │ ▲       │                                   │
│  │       │ │       │ │       │ │       │                                   │
│  Auto-charged via Stripe Subscription                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fee Structure Summary

### Event Ticket Sales

| Party | Amount (on $50 ticket) | Percentage |
|-------|------------------------|------------|
| Customer Pays | $50.00 | 100% |
| Stripe Processing | ~$1.75 | 3.5%* |
| Maly Platform Fee | $1.50 | 3% |
| **Host Receives** | **~$46.75** | **~93.5%** |

*Stripe fees vary: 2.9% + $0.30 for US cards

### Premium Subscriptions

| Plan | Price | Billing |
|------|-------|---------|
| Monthly | $29/month | Recurring |
| Yearly | $290/year | Recurring |

100% of subscription revenue goes to Maly (no Connect split).

---

## Database Tables for Payments

```sql
-- Payments table (ticket purchases)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_participant_id INTEGER REFERENCES event_participants(id),
  stripe_charge_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL,  -- in cents
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table (premium)
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  subscription_type TEXT DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Connect status
ALTER TABLE users ADD COLUMN stripe_account_id TEXT;
ALTER TABLE users ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
```

---

## Refund Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REFUND FLOW (Manual via Stripe Dashboard)                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. Admin accesses Stripe Dashboard
2. Finds the payment/charge
3. Issues refund (full or partial)
4. Stripe handles:
   • Return to customer card
   • Reverse transfer from host (if applicable)
   • Update payment intent status
5. Webhook received: charge.refunded
6. Update database records:
   • payments.status = 'refunded'
   • event_participants.paymentStatus = 'refunded'

Note: Application fee (3%) is NOT refunded by default.
      Configure in Stripe settings if needed.
```

---

## Testing & Development

### Test Mode

```javascript
// Use Stripe test keys in development
STRIPE_SECRET_KEY=sk_test_...

// Test card numbers
4242 4242 4242 4242  // Successful payment
4000 0000 0000 9995  // Declined card
4000 0000 0000 3220  // 3D Secure required
```

### Webhook Testing

```bash
# Forward webhooks to local development
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger account.updated
```

### E2E Test Coverage

The application includes 31 passing Stripe Connect E2E tests:
- Account creation flow
- Onboarding completion
- Destination charge creation
- Application fee calculation
- Webhook processing
- Error handling
