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