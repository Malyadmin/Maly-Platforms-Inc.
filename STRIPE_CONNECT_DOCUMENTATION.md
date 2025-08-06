# Stripe Connect Implementation Documentation

## Overview

This document outlines the complete Stripe Connect integration that enables event hosts to connect their bank accounts and receive direct payouts from ticket sales, while the Maly platform automatically collects a 3% application fee on all transactions.

## System Architecture

### Core Components

1. **Express Connect Accounts**: Simplified onboarding for event hosts
2. **Destination Charges**: Direct payment routing with application fees
3. **Webhook Monitoring**: Real-time account status updates
4. **Database Integration**: Connect status tracking in user records

### Payment Flow

```
Customer Purchase → Stripe Payment Intent → Application Fee (3%) → Host Payout (97%)
```

## Database Schema Changes

### Users Table Extensions

```sql
ALTER TABLE users ADD COLUMN stripe_account_id TEXT;
ALTER TABLE users ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
```

## API Endpoints

### 1. Create Connect Account

**Endpoint**: `POST /api/stripe/connect/create-account`
**Authentication**: Required
**Description**: Creates a new Stripe Express Connect account for the authenticated user

#### Request
```bash
curl -X POST http://localhost:5000/api/stripe/connect/create-account \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your_session_id"
```

#### Response
```json
{
  "account": {
    "id": "acct_1234567890",
    "object": "account",
    "business_profile": {},
    "capabilities": {
      "card_payments": "inactive",
      "transfers": "inactive"
    },
    "charges_enabled": false,
    "country": "US",
    "created": 1234567890,
    "details_submitted": false,
    "email": "host@example.com",
    "payouts_enabled": false,
    "type": "express"
  }
}
```

#### Error Responses
- `401`: Authentication required
- `400`: User already has a Stripe Connect account
- `404`: User not found
- `500`: Failed to create Stripe Connect account

### 2. Create Account Link

**Endpoint**: `POST /api/stripe/connect/create-account-link`
**Authentication**: Required
**Description**: Generates an onboarding link for the user's Connect account

#### Request
```bash
curl -X POST http://localhost:5000/api/stripe/connect/create-account-link \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your_session_id" \
  -H "Origin: https://your-domain.com"
```

#### Response
```json
{
  "url": "https://connect.stripe.com/setup/s/acct_1234567890/AbCdEfGhIjKlMnOp"
}
```

#### Error Responses
- `401`: Authentication required
- `400`: User does not have a Stripe Connect account
- `500`: Failed to create account link

### 3. Get Account Status

**Endpoint**: `GET /api/stripe/connect/account-status`
**Authentication**: Required
**Description**: Returns the current Connect account status for the authenticated user

#### Request
```bash
curl -X GET http://localhost:5000/api/stripe/connect/account-status \
  -H "Cookie: connect.sid=your_session_id"
```

#### Response (No Account)
```json
{
  "hasAccount": false,
  "onboardingComplete": false
}
```

#### Response (With Account)
```json
{
  "hasAccount": true,
  "onboardingComplete": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true
}
```

### 4. Connect Webhook Handler

**Endpoint**: `POST /api/webhooks/stripe/connect`
**Authentication**: None (Stripe signature verification)
**Description**: Handles Stripe Connect webhook events for account status updates

#### Supported Events
- `account.updated`: Updates user Connect status when capabilities change

#### Webhook Configuration
Set the webhook endpoint URL in your Stripe Dashboard:
```
https://your-domain.com/api/webhooks/stripe/connect
```

## Payment Integration

### Modified Checkout Session Creation

The payment checkout system has been enhanced to support Connect payments:

#### Key Changes
1. **Creator Validation**: Verifies event creator has completed Connect onboarding
2. **Application Fee Calculation**: Automatically calculates 3% platform fee
3. **Destination Charges**: Routes payment to creator's Connect account

#### Example Checkout Session
```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [/* ... */],
  mode: 'payment',
  payment_intent_data: {
    application_fee_amount: 150, // 3% of $50 ticket = $1.50
    transfer_data: {
      destination: 'acct_host123',
    },
  },
  metadata: {
    eventId: '1',
    userId: '2',
    quantity: '1',
    creatorId: '3',
    applicationFeeAmount: '150',
  },
});
```

## Environment Variables

### Required Configuration
```bash
# Stripe API keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook secrets
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
```

## Implementation Files

### Core Module
- `server/stripeConnect.ts`: Main Connect functionality
- `server/routes.ts`: API endpoint integration

### Database Schema
- `db/schema.ts`: User table Connect field definitions

### Frontend Integration
- Event creation form should check Connect status
- Payment flow should handle Connect errors gracefully

## Testing

### Manual Testing Scenarios

1. **Account Creation Flow**
   ```bash
   # Login as event host
   # Create Connect account
   curl -X POST http://localhost:5000/api/stripe/connect/create-account
   
   # Get onboarding link
   curl -X POST http://localhost:5000/api/stripe/connect/create-account-link
   
   # Complete onboarding in Stripe
   # Check status
   curl -X GET http://localhost:5000/api/stripe/connect/account-status
   ```

2. **Payment Flow Testing**
   ```bash
   # Create event as connected host
   # Attempt ticket purchase
   # Verify application fee calculation
   # Confirm payout to host account
   ```

### Test Webhooks
Use Stripe CLI to forward webhooks for testing:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe/connect
```

## Security Considerations

1. **Authentication**: All Connect endpoints require user authentication
2. **Webhook Verification**: Connect webhooks use signature verification
3. **Account Isolation**: Users can only access their own Connect accounts
4. **Error Handling**: Graceful degradation when Connect services are unavailable

## Fee Structure

- **Platform Fee**: 3% of total transaction amount
- **Stripe Processing**: Standard Stripe fees apply (2.9% + 30¢)
- **Host Receives**: 97% of ticket price minus Stripe processing fees

## Onboarding Flow

1. User creates event (prompts for Connect setup if needed)
2. User clicks "Set up payouts" button
3. System creates Express Connect account
4. User redirected to Stripe onboarding
5. User completes business information
6. Webhook updates onboarding status
7. User can now receive payments for ticket sales

## Error Handling

### Common Error Scenarios
1. **User Not Connected**: Friendly message with setup instructions
2. **Incomplete Onboarding**: Link to complete Connect onboarding
3. **Account Restrictions**: Clear explanation of restrictions
4. **Payment Failures**: Fallback to platform-held funds

### Error Recovery
- Automatic retry for temporary failures
- Manual intervention for account issues
- Clear user communication about next steps

## Compliance & Legal

- Event hosts are responsible for tax reporting on their earnings
- Platform provides transaction data for tax purposes
- Terms of service should outline fee structure and responsibilities
- Regular compliance reviews with legal team

## Monitoring & Analytics

### Key Metrics
- Connect account creation rate
- Onboarding completion rate
- Payment success rate
- Application fee collection
- Host payout timing

### Alerts
- Failed webhook processing
- High error rates in Connect operations
- Unusual fee calculation patterns
- Account restriction notifications

## Future Enhancements

1. **Multi-currency Support**: International event hosting
2. **Instant Payouts**: Real-time fund transfers
3. **Advanced Analytics**: Host earnings dashboard
4. **Automated Tax Documents**: 1099 generation
5. **Marketplace Features**: Enhanced host verification