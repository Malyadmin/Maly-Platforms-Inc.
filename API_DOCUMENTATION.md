# API Documentation

## Authentication

Maly supports two authentication methods to serve both web and mobile applications:

1. **Session-based authentication** - For web applications using cookies
2. **JWT token-based authentication** - For mobile applications using Bearer tokens

### Mobile Login Flow

#### POST /api/login

Authenticates a user and returns both session data (for web compatibility) and a JWT token (for mobile app usage).

**Request Body:**
```json
{
  "username": "user@example.com",  // Can be username or email
  "password": "userpassword"
}
```

**Response (Success - 200 OK):**
```json
{
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "user@example.com",
    "fullName": "John Doe",
    "profileImage": "https://example.com/profile.jpg",
    "location": "New York, NY",
    "interests": ["technology", "travel"],
    "currentMoods": ["exploring", "networking"],
    "profession": "Software Developer",
    "age": 28,
    "gender": "male",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "authenticated": true,
  "sessionId": "sess_abc123def456",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": "Email/username and password are required"
}
```

**Response (Error - 400 Bad Request - Invalid Credentials):**
```json
{
  "error": "Invalid username/email or password."
}
```

### Using JWT Token for Mobile Authentication

After successful login, mobile applications should:

1. Store the `token` from the login response
2. Include the token in the `Authorization` header for all subsequent API requests

**Authorization Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example API Request with JWT:**
```bash
curl -X GET https://api.maly.com/api/user-profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### JWT Token Details

- **Algorithm**: HS256
- **Expiration**: 30 days (matches session expiry)
- **Secret**: Uses the same `SESSION_SECRET` environment variable as session authentication
- **Payload**: Contains user ID, email, and username

### Protected Routes

Routes that require authentication will accept either:
- Valid session cookie (for web applications)
- Valid JWT token in Authorization header (for mobile applications)

### Token Errors

**Invalid Token (401 Unauthorized):**
```json
{
  "error": "Invalid token"
}
```

**Expired Token (401 Unauthorized):**
```json
{
  "error": "Token expired"
}
```

**Missing Authorization Header (401 Unauthorized):**
```json
{
  "error": "Authorization header with Bearer token required"
}
```

### Implementation Notes

- JWT tokens are signed using the `SESSION_SECRET` environment variable
- Token expiration matches session expiration (30 days)
- For mobile apps, use the JWT token; for web apps, continue using session cookies
- Both authentication methods can be used simultaneously for hybrid applications

## Middleware Usage

### Required Authentication

Use `verifyToken` middleware for routes that require authentication:

```typescript
import { verifyToken } from './middleware/jwtAuth';

app.get('/api/protected-route', verifyToken, (req, res) => {
  // req.user will contain the authenticated user data
  res.json({ message: 'Access granted', user: req.user });
});
```

### Optional Authentication

Use `verifyTokenOptional` middleware for routes that work with or without authentication:

```typescript
import { verifyTokenOptional } from './middleware/jwtAuth';

app.get('/api/public-route', verifyTokenOptional, (req, res) => {
  // req.user will be populated if token is provided and valid
  if (req.user) {
    res.json({ message: 'Authenticated access', user: req.user });
  } else {
    res.json({ message: 'Public access' });
  }
});
```

## Security Considerations

- JWT tokens should be stored securely on mobile devices
- Always use HTTPS in production to protect tokens in transit
- Tokens contain user information but are signed to prevent tampering
- Monitor for unusual authentication patterns or token misuse
- Consider implementing token refresh functionality for enhanced security

---

# Complete API Endpoints Reference

## Authentication Endpoints

### POST /api/register

Creates a new user account with optional profile image upload.

**Request Body (multipart/form-data):**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "location": "New York, NY",
  "interests": ["technology", "travel"],
  "profession": "Software Developer",
  "currentMoods": ["exploring", "networking"],
  "age": 28,
  "gender": "male",
  "nextLocation": "San Francisco, CA",
  "profileImage": "<file>"
}
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "profileImage": "https://example.com/profile.jpg",
    "location": "New York, NY",
    "interests": ["technology", "travel"],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "authenticated": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Username, email, and password are required"
}
```

### POST /api/register-redirect

Registration endpoint that redirects to auth page on completion (for form submissions).

**Request Body:** Same as `/api/register`
**Response:** Redirects to `/auth` with success or error parameters.

### POST /api/logout

Logs out the current user and destroys the session.

**Request Body:** None required
**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/auth/check

Checks if the user is currently authenticated.

**Query Parameters:** None
**Success Response (200 OK):**
```json
{
  "authenticated": true,
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "authenticated": false,
  "message": "Not logged in"
}
```

### GET /api/user

Returns current authenticated user information.

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "profileImage": "https://example.com/profile.jpg",
  "location": "New York, NY",
  "interests": ["technology", "travel"]
}
```

**Error Response (401 Unauthorized):**
```text
"Not authenticated"
```

### POST /api/verify-user

Verifies if a user exists by ID.

**Request Body:**
```json
{
  "userId": 123
}
```

**Success Response (200 OK):**
```json
{
  "valid": true
}
```

**Error Response (404 Not Found):**
```text
"User not found"
```

### GET /api/replit-info

Returns information about the Replit environment.

**Success Response (200 OK):**
```json
{
  "isReplit": true,
  "replId": "abc123",
  "owner": "username",
  "slug": "project-name"
}
```

## User Management Endpoints

### GET /api/users/browse

Browse and filter users based on various criteria.

**Query Parameters:**
- `location` (string): Filter by user location
- `city` (string): Filter by city
- `age` (string): Age range filter
- `gender` (string): Gender filter
- `interests` (string): Comma-separated interests
- `currentMoods` (string): Comma-separated moods
- `limit` (number): Number of results to return

**Success Response (200 OK):**
```json
[
  {
    "id": 123,
    "username": "johndoe",
    "fullName": "John Doe",
    "age": 28,
    "gender": "male",
    "location": "New York, NY",
    "interests": ["technology", "travel"],
    "currentMoods": ["exploring"],
    "profileImage": "https://example.com/profile.jpg"
  }
]
```

### GET /api/users/:username

Get user profile by username.

**Path Parameters:**
- `username` (string): The username to look up

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "johndoe",
  "fullName": "John Doe",
  "bio": "Software developer and traveler",
  "location": "New York, NY",
  "interests": ["technology", "travel"],
  "profileImage": "https://example.com/profile.jpg",
  "eventsHosting": [1, 2, 3]
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

### GET /api/users/profile/:userId

Get detailed user profile by user ID.

**Path Parameters:**
- `userId` (number): The user ID to look up

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "johndoe",
  "fullName": "John Doe",
  "bio": "Software developer and traveler",
  "location": "New York, NY",
  "age": 28,
  "gender": "male",
  "profession": "Software Developer",
  "interests": ["technology", "travel"],
  "currentMoods": ["exploring"],
  "profileImage": "https://example.com/profile.jpg",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /api/users/:userId

Get basic user information by user ID.

**Path Parameters:**
- `userId` (number): The user ID to look up

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "johndoe",
  "fullName": "John Doe",
  "profileImage": "https://example.com/profile.jpg"
}
```

### GET /api/users/username/:username

Get user by username with full profile data.

**Path Parameters:**
- `username` (string): The username to look up

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "johndoe",
  "fullName": "John Doe",
  "location": "New York, NY",
  "interests": ["technology", "travel"]
}
```

### POST /api/profile

Update user profile information.

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "bio": "Updated bio",
  "location": "San Francisco, CA",
  "interests": ["technology", "travel", "photography"],
  "currentMoods": ["creating", "networking"],
  "profession": "Senior Developer",
  "age": 29
}
```

**Success Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 123,
    "username": "johndoe",
    "fullName": "John Doe Updated",
    "bio": "Updated bio",
    "location": "San Francisco, CA"
  }
}
```

### GET /api/user-by-session

Get user information by session ID.

**Headers:**
- `x-session-id` (string): Session ID

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "authenticated": true
}
```

### POST /api/upload-profile-image

Upload a new profile image for the authenticated user.

**Request Body (multipart/form-data):**
- `image` (file): Image file to upload

**Success Response (200 OK):**
```json
{
  "message": "Profile image uploaded successfully",
  "imageUrl": "https://cloudinary.com/image.jpg"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "No image file provided"
}
```

## Events Endpoints

### GET /api/events

Get list of events with optional filtering.

**Query Parameters:**
- `location` (string): Filter by event location
- `category` (string): Filter by event category
- `currentUserId` (number): Current user ID for personalization

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Tech Meetup",
    "description": "Monthly tech networking event",
    "location": "New York, NY",
    "latitude": "40.7128",
    "longitude": "-74.0060",
    "date": "2024-02-15T19:00:00Z",
    "category": "Professional",
    "image": "https://example.com/event.jpg",
    "price": "25",
    "capacity": 100,
    "attendingCount": 45,
    "interestedCount": 23,
    "creatorId": 123
  }
]
```

### GET /api/events/:id

Get detailed information about a specific event.

**Path Parameters:**
- `id` (number): Event ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "title": "Tech Meetup",
  "description": "Monthly tech networking event with guest speakers",
  "location": "New York, NY",
  "address": "123 Main St, New York, NY",
  "latitude": "40.7128",
  "longitude": "-74.0060",
  "date": "2024-02-15T19:00:00Z",
  "endDate": "2024-02-15T22:00:00Z",
  "category": "Professional",
  "image": "https://example.com/event.jpg",
  "price": "25",
  "ticketType": "paid",
  "capacity": 100,
  "availableTickets": 55,
  "attendingCount": 45,
  "interestedCount": 23,
  "tags": ["networking", "technology"],
  "creatorId": 123,
  "itinerary": [
    {
      "startTime": "19:00",
      "endTime": "19:30",
      "description": "Registration and networking"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Event not found"
}
```

### POST /api/events

Create a new event.

**Request Body (multipart/form-data):**
```json
{
  "title": "New Tech Meetup",
  "description": "Exciting tech event",
  "location": "San Francisco, CA",
  "address": "456 Tech St, San Francisco, CA",
  "date": "2024-03-15T19:00:00Z",
  "endDate": "2024-03-15T22:00:00Z",
  "category": "Professional",
  "price": "30",
  "ticketType": "paid",
  "capacity": 150,
  "tags": ["networking", "technology", "innovation"],
  "image": "<file>",
  "itinerary": [
    {
      "startTime": "19:00",
      "endTime": "19:30",
      "description": "Registration"
    }
  ]
}
```

**Success Response (201 Created):**
```json
{
  "id": 2,
  "title": "New Tech Meetup",
  "description": "Exciting tech event",
  "location": "San Francisco, CA",
  "address": "456 Tech St, San Francisco, CA",
  "latitude": "37.7749",
  "longitude": "-122.4194",
  "date": "2024-03-15T19:00:00Z",
  "creatorId": 123,
  "message": "Event created successfully"
}
```

### PUT /api/events/:id

Update an existing event.

**Path Parameters:**
- `id` (number): Event ID to update

**Request Body:** Same as POST /api/events
**Success Response (200 OK):**
```json
{
  "message": "Event updated successfully",
  "event": {
    "id": 1,
    "title": "Updated Tech Meetup",
    "description": "Updated description"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "You can only edit events you created"
}
```

### DELETE /api/events/:id

Delete an event.

**Path Parameters:**
- `id` (number): Event ID to delete

**Success Response (200 OK):**
```json
{
  "message": "Event deleted successfully",
  "eventId": 1
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Event not found"
}
```

### GET /api/events/:eventId/participation/status

Get user's participation status for an event.

**Path Parameters:**
- `eventId` (number): Event ID

**Success Response (200 OK):**
```json
{
  "status": "attending",
  "ticketQuantity": 1,
  "purchaseDate": "2024-01-15T10:30:00Z"
}
```

### POST /api/events/:eventId/participate

Update user's participation status for an event.

**Path Parameters:**
- `eventId` (number): Event ID

**Request Body:**
```json
{
  "status": "attending"
}
```

**Success Response (200 OK):**
```json
{
  "participation": {
    "status": "attending",
    "ticketQuantity": 1
  },
  "event": {
    "id": 1,
    "attendingCount": 46,
    "interestedCount": 23
  }
}
```

### GET /api/events/:city

Get events filtered by city.

**Path Parameters:**
- `city` (string): City name

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Tech Meetup",
    "location": "New York, NY",
    "date": "2024-02-15T19:00:00Z"
  }
]
```

## Connection Management Endpoints

### POST /api/connections/request

Send a connection request to another user.

**Request Body:**
```json
{
  "targetUserId": 456
}
```

**Success Response (200 OK):**
```json
{
  "message": "Connection request sent successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Cannot send request to yourself"
}
```

### GET /api/connections/pending

Get pending connection requests for the authenticated user.

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "requesterId": 456,
    "requesterUsername": "jane_doe",
    "requesterFullName": "Jane Doe",
    "requesterProfileImage": "https://example.com/jane.jpg",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### PUT /api/connections/:userId

Accept or reject a connection request.

**Path Parameters:**
- `userId` (number): User ID of the connection request

**Request Body:**
```json
{
  "action": "accept"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Connection request accepted"
}
```

### GET /api/connections

Get all connections for the authenticated user.

**Success Response (200 OK):**
```json
[
  {
    "id": 456,
    "username": "jane_doe",
    "fullName": "Jane Doe",
    "profileImage": "https://example.com/jane.jpg",
    "location": "Boston, MA",
    "connectedAt": "2024-01-15T10:30:00Z"
  }
]
```

### GET /api/connections/status/:userId

Get connection status with a specific user.

**Path Parameters:**
- `userId` (number): User ID to check connection status with

**Success Response (200 OK):**
```json
{
  "status": "connected",
  "connectionId": 123
}
```

## Messaging Endpoints

### POST /api/messages

Send a message to another user.

**Request Body:**
```json
{
  "senderId": 123,
  "receiverId": 456,
  "content": "Hello! How are you?"
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "senderId": 123,
  "receiverId": 456,
  "content": "Hello! How are you?",
  "createdAt": "2024-01-15T10:30:00Z",
  "isRead": false
}
```

### GET /api/conversations/:userId

Get all conversations for a user.

**Path Parameters:**
- `userId` (number): User ID

**Success Response (200 OK):**
```json
[
  {
    "otherUserId": 456,
    "otherUserName": "Jane Doe",
    "otherUserImage": "https://example.com/jane.jpg",
    "lastMessage": "Hello! How are you?",
    "lastMessageTime": "2024-01-15T10:30:00Z",
    "unreadCount": 2
  }
]
```

### GET /api/messages/:userId/:otherId

Get messages between two users.

**Path Parameters:**
- `userId` (number): First user ID
- `otherId` (number): Second user ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "senderId": 123,
    "receiverId": 456,
    "content": "Hello! How are you?",
    "createdAt": "2024-01-15T10:30:00Z",
    "isRead": true
  }
]
```

### POST /api/messages/:messageId/read

Mark a specific message as read.

**Path Parameters:**
- `messageId` (number): Message ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "isRead": true,
  "readAt": "2024-01-15T10:35:00Z"
}
```

### POST /api/messages/read-all/:userId

Mark all messages as read for a user.

**Path Parameters:**
- `userId` (number): User ID

**Success Response (200 OK):**
```json
{
  "message": "All messages marked as read",
  "count": 5
}
```

## Matching and Suggestions

### GET /api/matches

Get user matches based on interests and location.

**Success Response (200 OK):**
```json
[
  {
    "id": 456,
    "username": "jane_doe",
    "fullName": "Jane Doe",
    "profileImage": "https://example.com/jane.jpg",
    "location": "New York, NY",
    "commonInterests": ["technology", "travel"],
    "compatibilityScore": 85
  }
]
```

### GET /api/users/:city

Get users filtered by city.

**Path Parameters:**
- `city` (string): City name

**Success Response (200 OK):**
```json
[
  {
    "id": 456,
    "username": "jane_doe",
    "fullName": "Jane Doe",
    "profileImage": "https://example.com/jane.jpg",
    "location": "New York, NY"
  }
]
```

## Translation and Communication

### POST /api/translate

Translate text to a target language.

**Request Body:**
```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "es"
}
```

**Success Response (200 OK):**
```json
{
  "translation": "Hola, ¿cómo estás?"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: text and targetLanguage"
}
```

### POST /api/chat

Send a message to AI chat assistant.

**Request Body:**
```json
{
  "message": "What events are happening in New York this weekend?",
  "userId": 123
}
```

**Success Response (200 OK):**
```json
{
  "response": "Here are some events happening in New York this weekend...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/suggest-city

Get AI-powered city suggestions.

**Request Body:**
```json
{
  "interests": ["technology", "nightlife"],
  "budget": "medium",
  "climate": "warm"
}
```

**Success Response (200 OK):**
```json
{
  "suggestions": [
    {
      "city": "Austin, TX",
      "reason": "Great tech scene and vibrant nightlife",
      "score": 92
    }
  ]
}
```

## Payment and Premium Features

### POST /api/payments/create-checkout-session

Create a Stripe checkout session for event tickets.

**Request Body:**
```json
{
  "eventId": 1,
  "quantity": 2,
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Success Response (200 OK):**
```json
{
  "sessionId": "cs_test_123...",
  "url": "https://checkout.stripe.com/pay/cs_test_123..."
}
```

### POST /api/webhooks/stripe

Handle Stripe webhook events. Upon successful payment completion (`checkout.session.completed`), the system now sets the participant status to `'pending_approval'` instead of `'attending'`, requiring host approval before the user can attend the event.

**Request Body:** Raw Stripe webhook payload
**Response:** 200 OK for successful processing

**Note:** Successful ticket purchases now result in a participant status of `'pending_approval'` which requires event host approval through the RSVP management endpoints.

## RSVP Management

### GET /api/events/:eventId/applications

Fetch all pending RSVP applications for a specific event. Only accessible by the event creator.

**Path Parameters:**
- `eventId` (number): The ID of the event

**Authorization:** Event creator verification required

**Success Response (200 OK):**
```json
{
  "eventId": 1,
  "eventTitle": "Tech Meetup 2024",
  "applications": [
    {
      "id": 123,
      "userId": 456,
      "status": "pending_approval",
      "ticketQuantity": 2,
      "purchaseDate": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "username": "johndoe",
      "fullName": "John Doe",
      "profileImage": "https://example.com/profile.jpg",
      "email": "john@example.com",
      "bio": "Software developer passionate about tech",
      "location": "San Francisco, CA"
    }
  ],
  "totalPending": 1
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "You can only manage applications for your own events"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Event not found"
}
```

### PUT /api/events/:eventId/applications/:userId

Approve or reject a pending RSVP application. Only accessible by the event creator.

**Path Parameters:**
- `eventId` (number): The ID of the event
- `userId` (number): The ID of the user whose application to update

**Authorization:** Event creator verification required

**Request Body:**
```json
{
  "status": "approved"  // or "rejected"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Application approved successfully",
  "application": {
    "id": 123,
    "eventId": 1,
    "userId": 456,
    "status": "attending",
    "ticketQuantity": 2,
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "applicant": {
    "username": "johndoe",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid status. Must be 'approved' or 'rejected'"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "You can only manage applications for your own events"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Pending application not found for this user and event"
}
```

### GET /api/tickets/:participantId/qr

Get QR code for event ticket.

**Path Parameters:**
- `participantId` (number): Event participant ID

**Success Response (200 OK):**
Returns QR code image as PNG

**Error Response (404 Not Found):**
```json
{
  "error": "Ticket not found"
}
```

### GET /api/me/latest-ticket

Get the latest ticket for the authenticated user.

**Success Response (200 OK):**
```json
{
  "id": 1,
  "eventId": 1,
  "eventTitle": "Tech Meetup",
  "ticketCode": "TICKET123",
  "status": "attending",
  "purchaseDate": "2024-01-15T10:30:00Z"
}
```

## Premium Subscription Endpoints

### GET /api/premium/status

Get premium subscription status for the authenticated user.

**Success Response (200 OK):**
```json
{
  "isPremium": true,
  "subscription": {
    "status": "active",
    "currentPeriodEnd": 1708128000000,
    "cancelAtPeriodEnd": false
  }
}
```

### POST /api/premium/create-checkout

Create premium subscription checkout session.

**Request Body:**
```json
{
  "priceId": "price_premium_monthly",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Success Response (200 OK):**
```json
{
  "sessionId": "cs_test_123...",
  "url": "https://checkout.stripe.com/pay/cs_test_123..."
}
```

### POST /api/premium/cancel

Cancel premium subscription.

**Success Response (200 OK):**
```json
{
  "message": "Subscription cancelled successfully",
  "cancelAtPeriodEnd": true
}
```

## Payment History and Analytics

### GET /api/me/payment-history

Get payment history for the authenticated user.

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "amount": 2500,
    "currency": "usd",
    "status": "completed",
    "description": "Event ticket purchase",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### GET /api/me/subscriptions/:id

Get specific subscription details.

**Path Parameters:**
- `id` (number): Subscription ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "status": "active",
  "currentPeriodStart": "2024-01-15T10:30:00Z",
  "currentPeriodEnd": "2024-02-15T10:30:00Z",
  "cancelAtPeriodEnd": false
}
```

## Referral System

### GET /api/referral/code

Get referral code for the authenticated user.

**Success Response (200 OK):**
```json
{
  "referralCode": "JOHN123",
  "shareUrl": "https://maly.app/join?ref=JOHN123"
}
```

### GET /api/referral/share-link

Get referral share link with custom message.

**Query Parameters:**
- `platform` (string): Platform for sharing (whatsapp, sms, email)

**Success Response (200 OK):**
```json
{
  "shareUrl": "https://maly.app/join?ref=JOHN123",
  "message": "Join me on Maly! Use my code JOHN123",
  "fullShareUrl": "https://wa.me/?text=Join%20me%20on%20Maly..."
}
```

### POST /api/referral/record

Record a referral when someone uses a referral code.

**Request Body:**
```json
{
  "referralCode": "JOHN123",
  "newUserId": 789
}
```

**Success Response (200 OK):**
```json
{
  "message": "Referral recorded successfully",
  "bonus": "Both users received 7 days premium!"
}
```

## Admin Endpoints

### POST /api/admin/create-payment-tables

Create payment-related database tables (admin only).

**Success Response (200 OK):**
```json
{
  "message": "Payment tables created successfully"
}
```

### GET /api/admin/payment-stats

Get payment statistics (admin only).

**Success Response (200 OK):**
```json
{
  "totalRevenue": 15000,
  "totalTransactions": 150,
  "activeSubscriptions": 45,
  "period": "last_30_days"
}
```

### GET /api/admin/all-payments

Get all payments (admin only).

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "userId": 123,
    "amount": 2500,
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### POST /api/admin/make-admin

Grant admin privileges to a user (admin only).

**Request Body:**
```json
{
  "userId": 123
}
```

**Success Response (200 OK):**
```json
{
  "message": "User granted admin privileges",
  "userId": 123
}
```

## AI Assistant Endpoints

### GET /api/ai/events

Get events with AI-powered filtering and natural language queries.

**Query Parameters:**
- `id` (number): Specific event ID
- `location` (string): Event location
- `city` (string): City name
- `category` (string): Event category
- `dateFrom` (string): Start date filter (ISO format)
- `dateTo` (string): End date filter (ISO format)

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Tech Meetup",
    "description": "Monthly tech networking event",
    "location": "New York, NY",
    "date": "2024-02-15T19:00:00Z",
    "humanReadableDate": "Thursday, February 15",
    "category": "Professional",
    "attendingCount": 45
  }
]
```

## JWT Test Endpoints

### GET /api/jwt-test

Test endpoint requiring JWT authentication.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Success Response (200 OK):**
```json
{
  "message": "JWT authentication successful!",
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Authorization header with Bearer token required"
}
```

### GET /api/jwt-test-optional

Test endpoint with optional JWT authentication.

**Headers (Optional):**
- `Authorization: Bearer <jwt_token>`

**Success Response (200 OK) - With Token:**
```json
{
  "message": "JWT authentication successful (optional)!",
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Success Response (200 OK) - Without Token:**
```json
{
  "message": "No JWT token provided, but access granted (optional endpoint)",
  "timestamp": "2024-01-15T10:30:00Z"
}