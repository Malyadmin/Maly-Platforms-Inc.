# Stripe Connect Integration Guide for iOS - Maly App

## Overview

This guide provides iOS developers with the complete API specification for integrating Stripe Connect host onboarding into the Maly mobile application. The Stripe Connect system allows event hosts to receive payments directly into their bank accounts with automatic platform fee collection.

## Authentication Requirements

All Stripe Connect endpoints require JWT authentication. Include the JWT token in the Authorization header for all API requests.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

The JWT token is obtained from the login API and expires after 30 days.

## Base URL

Replace `{BASE_URL}` with your API base URL (e.g., `https://your-app.replit.app`)

---

## API Endpoints

### 1. Create Stripe Connect Account

Creates a new Stripe Express Connect account for the authenticated user.

**Endpoint:** `POST {BASE_URL}/api/stripe/connect/create-account`

**Authentication:** Required (JWT Bearer token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:** None (empty POST request)

**Success Response (200):**
```json
{
  "account": {
    "id": "acct_1234567890",
    "object": "account",
    "business_profile": {
      "mcc": null,
      "name": null,
      "product_description": null,
      "support_address": null,
      "support_email": null,
      "support_phone": null,
      "support_url": null,
      "url": null
    },
    "business_type": null,
    "capabilities": {
      "card_payments": "inactive",
      "transfers": "inactive"
    },
    "charges_enabled": false,
    "country": "US",
    "created": 1234567890,
    "default_currency": "usd",
    "details_submitted": false,
    "email": "user@example.com",
    "payouts_enabled": false,
    "type": "express"
  }
}
```

**Error Responses:**

*401 Unauthorized:*
```json
{
  "error": "Authentication required"
}
```

*400 Bad Request (User already has account):*
```json
{
  "error": "User already has a Stripe Connect account"
}
```

*404 Not Found:*
```json
{
  "error": "User not found"
}
```

*400 Bad Request (Platform configuration issue):*
```json
{
  "error": "Platform configuration incomplete. Please contact support to complete Stripe platform setup.",
  "details": "The Stripe Connect platform profile needs to be configured before creating Express accounts."
}
```

*500 Internal Server Error:*
```json
{
  "error": "Failed to create Stripe Connect account"
}
```

---

### 2. Create Account Onboarding Link

Generates a Stripe-hosted onboarding URL for the user to complete their account setup.

**Endpoint:** `POST {BASE_URL}/api/stripe/connect/create-account-link`

**Authentication:** Required (JWT Bearer token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
Origin: <your_app_origin>
```

**Important:** Include the `Origin` header with your app's domain. This is used to generate proper return and refresh URLs.

**Request Body:** None (empty POST request)

**Success Response (200):**
```json
{
  "url": "https://connect.stripe.com/express/setup/acct_1234567890/abcdef123456"
}
```

**Error Responses:**

*401 Unauthorized:*
```json
{
  "error": "Authentication required"
}
```

*400 Bad Request (No Connect account):*
```json
{
  "error": "User does not have a Stripe Connect account"
}
```

*500 Internal Server Error:*
```json
{
  "error": "Failed to create account link"
}
```

**Usage Notes:**
- Call this endpoint after successfully creating a Connect account
- Open the returned URL in a web view or Safari for the user to complete onboarding
- The user will be redirected to `{origin}/stripe/connect/success` upon completion
- If they need to restart, they'll be redirected to `{origin}/stripe/connect/reauth`

---

### 3. Get Account Status

Retrieves the current Stripe Connect account status for the authenticated user.

**Endpoint:** `GET {BASE_URL}/api/stripe/connect/account-status`

**Authentication:** Required (JWT Bearer token)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**

*User with completed onboarding:*
```json
{
  "hasAccount": true,
  "onboardingComplete": true
}
```

*User with incomplete onboarding:*
```json
{
  "hasAccount": true,
  "onboardingComplete": false
}
```

*User without any account:*
```json
{
  "hasAccount": false,
  "onboardingComplete": false
}
```

**Error Responses:**

*401 Unauthorized:*
```json
{
  "error": "Authentication required"
}
```

*500 Internal Server Error:*
```json
{
  "error": "Failed to get account status"
}
```

---

### 4. Verify Account (Optional)

Manually verifies account status directly from Stripe (for debugging/refreshing status).

**Endpoint:** `POST {BASE_URL}/api/stripe/connect/verify-account`

**Authentication:** Required (JWT Bearer token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:** None (empty POST request)

**Success Response (200):**
```json
{
  "hasAccount": true,
  "onboardingComplete": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true
}
```

**Error Responses:** Same as other endpoints

---

## Data Types

### ConnectAccountStatus Interface
```typescript
interface ConnectAccountStatus {
  hasAccount: boolean;           // Whether user has a Stripe Connect account
  onboardingComplete: boolean;   // Whether onboarding is complete
  chargesEnabled?: boolean;      // Whether account can accept payments (optional)
  payoutsEnabled?: boolean;      // Whether account can receive payouts (optional)
  detailsSubmitted?: boolean;    // Whether all required details are submitted (optional)
}
```

## Implementation Flow

### For New Hosts (First-time Setup)

1. **Check Status** - Call `GET /api/stripe/connect/account-status`
   - If `hasAccount: false`, proceed to step 2
   - If `hasAccount: true` but `onboardingComplete: false`, skip to step 4
   - If `hasAccount: true` and `onboardingComplete: true`, setup is complete

2. **Create Account** - Call `POST /api/stripe/connect/create-account`
   - Store the account ID if needed (though the backend handles this)
   - Handle errors appropriately

3. **Get Onboarding Link** - Call `POST /api/stripe/connect/create-account-link`
   - Ensure proper `Origin` header is set
   - Get the onboarding URL

4. **Present Onboarding** - Open the Stripe onboarding URL
   - Use `SFSafariViewController` or `WKWebView`
   - Monitor for redirect to success/reauth URLs
   - Handle user completion or cancellation

5. **Verify Completion** - After user returns from Stripe
   - Call `GET /api/stripe/connect/account-status` again
   - Check if `onboardingComplete: true`
   - Update UI accordingly

### For Existing Hosts

- Call `GET /api/stripe/connect/account-status` to check current status
- If `onboardingComplete: false`, allow them to retry onboarding by calling the create account link endpoint
- If `onboardingComplete: true`, they can create paid events

## Error Handling

### Common Error Scenarios

1. **Authentication Errors (401)**
   - JWT token expired or invalid
   - Redirect user to login

2. **Platform Configuration Errors (400)**
   - Contact support message should be shown
   - This indicates a backend configuration issue

3. **Network Errors (500)**
   - Show retry option
   - May be temporary Stripe API issues

4. **Account Already Exists (400)**
   - Skip account creation, proceed directly to onboarding link generation

## Webhook Updates

The backend automatically updates account status via Stripe webhooks. The `account.updated` webhook triggers updates to the `onboardingComplete` status in the database when:

1. `details_submitted` is `true`
2. No `currently_due` requirements remain
3. `charges_enabled` is `true`

This means the status can change asynchronously, so it's good practice to check status before critical operations.

## Testing

### Test Scenarios

1. **First-time host setup** - Complete flow from account creation to onboarding
2. **Existing host with incomplete onboarding** - Resume onboarding process
3. **Completed host** - Verify status correctly shows completion
4. **Error handling** - Test various error conditions
5. **Status refresh** - Test status updates after onboarding completion

### Test Account Details

Use Stripe test mode for development. The backend should be configured with test API keys, and you can use Stripe's test card numbers for completing onboarding.

## Security Notes

1. **Never store Stripe account IDs locally** - Always fetch from the API
2. **JWT tokens should be stored securely** - Use iOS Keychain
3. **Validate server responses** - Don't trust client-side state alone
4. **Handle sensitive redirects carefully** - Ensure onboarding URLs are opened securely

## Example Swift Implementation Snippets

### API Service Class Structure
```swift
class StripeConnectService {
    private let baseURL = "https://your-app.replit.app"
    private let session = URLSession.shared
    
    func createConnectAccount() async throws -> ConnectAccountResponse
    func createAccountLink() async throws -> AccountLinkResponse  
    func getAccountStatus() async throws -> ConnectAccountStatus
}
```

### Authentication Header Helper
```swift
private func createAuthenticatedRequest(url: URL, method: HTTPMethod = .GET) -> URLRequest {
    var request = URLRequest(url: url)
    request.httpMethod = method.rawValue
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    if let token = AuthManager.shared.jwtToken {
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    
    return request
}
```

This guide provides everything needed to integrate Stripe Connect onboarding into your iOS application. The backend handles all the complex Stripe interactions, so the mobile app only needs to call these endpoints and handle the user experience around onboarding.