# Maly API Documentation

## Overview

Maly uses a RESTful API architecture built with Express.js. All endpoints are prefixed with `/api/` and return JSON responses. Authentication is handled via session-based cookies (web) or JWT tokens (mobile).

---

## Authentication Endpoints

### POST `/api/register`
Create a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

### POST `/api/register-redirect`
Registration with profile image upload and automatic login.

**Request:** `multipart/form-data`
- `username`, `email`, `password`, `fullName`
- `images` (file array)

### POST `/api/login`
Authenticate existing user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "user": { ... },
  "token": "jwt_token (for mobile)"
}
```

### POST `/api/login-redirect`
Login with redirect URL support.

### POST `/api/logout`
End user session.

### GET `/api/auth/check`
Verify authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": { ... }
}
```

### GET `/api/user`
Get current authenticated user data.

---

## User Management

### POST `/api/profile`
Update user profile information.

**Request Body:**
```json
{
  "fullName": "string",
  "bio": "string",
  "location": "string",
  "interests": ["string"],
  "currentMoods": ["string"],
  "profession": "string"
}
```

### GET `/api/users/profile/:userId`
Get public profile by user ID.

### GET `/api/users/username/:username`
Get user by username.

### GET `/api/users/browse`
Browse users with filters.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `city`: Filter by city
- `gender`: Filter by gender
- `intention`: Filter by intention (dating, social, networking, friends)
- `vibes`: Filter by mood/vibe

### POST `/api/verify-user`
Verify if a user exists.

---

## Events

### GET `/api/events`
Get all events with optional filters.

**Query Parameters:**
- `city`: Filter by city
- `category`: Event category
- `dateFrom`: Start date (ISO string)
- `dateTo`: End date (ISO string)
- `timeFrame`: Today, This Week, This Weekend, This Month

**Response:**
```json
[
  {
    "id": 1,
    "title": "Beach Party",
    "description": "...",
    "city": "Miami",
    "location": "South Beach",
    "date": "2025-01-15T20:00:00Z",
    "category": "Social",
    "price": "25",
    "ticketType": "paid",
    "isRsvp": false,
    "creator": { ... }
  }
]
```

### POST `/api/events`
Create a new event (authenticated).

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "city": "string",
  "location": "string",
  "address": "string (optional)",
  "date": "ISO date string",
  "endDate": "ISO date string (optional)",
  "category": "string",
  "capacity": "number (optional)",
  "price": "string",
  "ticketType": "free | paid | donation",
  "isPrivate": "boolean",
  "isRsvp": "boolean",
  "itinerary": [{ "startTime": "string", "endTime": "string", "description": "string" }],
  "dressCode": "string (optional)"
}
```

### PUT `/api/events/:id`
Update an existing event (creator only).

### DELETE `/api/events/:id`
Delete an event (creator only).

### GET `/api/events/:eventId/qr`
Download QR code ticket for an event.

---

## RSVP & Event Participation

### GET `/api/events/:eventId/participation/status`
Get current user's participation status for an event.

### POST `/api/events/:eventId/applications`
Submit an RSVP request for an event.

**Request Body:**
```json
{
  "message": "string (optional)"
}
```

### GET `/api/events/:eventId/applications`
Get pending RSVP applications (event creator only).

### PUT `/api/events/:eventId/applications/:userId`
Approve or reject an RSVP application.

**Request Body:**
```json
{
  "status": "approved | declined"
}
```

### GET `/api/events/:eventId/participants/attending`
List attending participants.

### GET `/api/events/:eventId/participants/interested`
List interested participants.

---

## Messaging & Conversations

### POST `/api/conversations`
Create or find a direct conversation.

**Request Body:**
```json
{
  "participantId": "number"
}
```

### GET `/api/conversations/:userId`
Get all conversations for a user.

### GET `/api/conversations/:conversationId/messages`
Get messages in a conversation.

### POST `/api/conversations/:conversationId/messages`
Send a message to a conversation.

**Request Body:**
```json
{
  "content": "string"
}
```

### POST `/api/conversations/:conversationId/read`
Mark conversation as read.

---

## AI & Chat

### POST `/api/chat`
Send message to AI concierge.

**Request Body:**
```json
{
  "message": "string",
  "context": "object (optional)",
  "language": "en | es"
}
```

**Response:**
```json
{
  "response": "AI response text",
  "events": [{ ... }]
}
```

---

## Payments & Stripe

### POST `/api/payments/create-checkout-session`
Create Stripe checkout session for event tickets.

**Request Body:**
```json
{
  "eventId": "number",
  "ticketTierId": "number (optional)",
  "quantity": "number"
}
```

### Stripe Connect (Host Payouts)

#### POST `/api/stripe/connect/create-account`
Create Stripe Express Connect account for event hosts.

#### POST `/api/stripe/connect/create-account-link`
Get onboarding link for Stripe Connect.

#### GET `/api/stripe/connect/account-status`
Check Connect account status.

#### POST `/api/stripe/connect/verify-account`
Manually sync account status with Stripe.

### Webhooks

#### POST `/api/webhooks/stripe`
General Stripe webhook handler (payments, refunds).

#### POST `/api/webhooks/stripe/connect`
Stripe Connect webhook handler (account updates).

---

## Premium Subscriptions

### GET `/api/premium/status`
Get user's premium subscription status.

### POST `/api/premium/create-checkout`
Create premium subscription checkout.

**Request Body:**
```json
{
  "subscriptionType": "monthly | yearly"
}
```

### GET `/api/premium/verify-checkout`
Verify premium checkout completion.

### POST `/api/premium/cancel`
Cancel premium subscription.

---

## Media Uploads

### POST `/api/upload-profile-image`
Upload single profile image.

**Request:** `multipart/form-data`
- `image` (file)

### POST `/api/upload-profile-images`
Upload multiple profile images.

**Request:** `multipart/form-data`
- `images` (file array, max 5)

### POST `/api/upload-images-public`
Public image upload (for registration flow).

---

## Push Notifications

### GET `/api/notifications/vapid-key`
Get VAPID public key for push notifications.

### POST `/api/notifications/subscribe`
Subscribe to push notifications.

**Request Body:**
```json
{
  "endpoint": "string",
  "keys": {
    "p256dh": "string",
    "auth": "string"
  }
}
```

### GET `/api/notifications/preferences`
Get notification preferences.

### PUT `/api/notifications/preferences`
Update notification preferences.

---

## Referrals

### GET `/api/referral/code`
Generate referral code for current user.

### GET `/api/referral/share-link`
Get shareable referral link.

### POST `/api/referral/record`
Record a referral upon signup.

---

## Translation

### POST `/api/translate`
Translate text to target language.

**Request Body:**
```json
{
  "text": "string",
  "targetLanguage": "en | es"
}
```

---

## WebSocket

### WS `/ws/chat`
Real-time WebSocket connection for chat messages.

**Connection:** `ws://[host]/ws/chat?userId=[userId]`

**Message Format:**
```json
{
  "type": "message",
  "conversationId": "number",
  "content": "string"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production:
- 100 requests/minute for authenticated users
- 20 requests/minute for unauthenticated users

---

## Authentication Headers

For JWT-based authentication (mobile):
```
Authorization: Bearer <jwt_token>
```

For session-based authentication (web):
Cookies are automatically included with `credentials: 'include'`
