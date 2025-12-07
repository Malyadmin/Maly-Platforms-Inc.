# Maly Security Overview

## Security Architecture

This document outlines the security measures, best practices, and considerations implemented in the Maly platform.

---

## Authentication Security

### Password Security

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PASSWORD SECURITY                                    │
└─────────────────────────────────────────────────────────────────────────────┘

User Password → bcrypt.hash(password, 10) → Stored Hash
                    │
                    │ 10 salt rounds (2^10 iterations)
                    │ Adaptive cost factor
                    │ Built-in salt generation
                    ▼
              ┌─────────────┐
              │  Database   │
              │  (hashed)   │
              └─────────────┘

Login Verification:
bcrypt.compare(inputPassword, storedHash) → true/false
```

**Implementation Details:**
- **Algorithm**: bcrypt with 10 salt rounds
- **Library**: `bcrypt` v5.1.1
- **Salt**: Automatically generated per password
- **Timing-safe**: bcrypt.compare is timing-attack resistant

### Session Security

```javascript
// Session Configuration
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,                                  // No JavaScript access
    sameSite: 'lax',                                // CSRF protection
    maxAge: 30 * 24 * 60 * 60 * 1000               // 30 days
  },
  store: new PgSession({
    pool: pgPool,
    tableName: 'session'
  })
}
```

**Security Features:**
- **HttpOnly Cookies**: Prevents XSS access to session
- **Secure Flag**: HTTPS-only in production
- **SameSite**: Lax mode for CSRF protection
- **PostgreSQL Store**: Sessions stored securely in database

### JWT Security (Mobile)

```javascript
// JWT Configuration
{
  algorithm: 'HS256',
  expiresIn: '30d',
  secret: process.env.JWT_SECRET
}

// Token Verification
jwt.verify(token, process.env.JWT_SECRET)
```

**JWT Security Measures:**
- **Expiration**: 30-day token lifetime
- **Signature Verification**: Server validates all tokens
- **Secret Key**: Environment variable, never exposed

---

## Authorization

### Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACCESS CONTROL MATRIX                                │
└─────────────────────────────────────────────────────────────────────────────┘

Resource              │ Anonymous │ User  │ Premium │ Admin │ Creator
──────────────────────┼───────────┼───────┼─────────┼───────┼─────────
View Events           │    ✓      │   ✓   │    ✓    │   ✓   │    ✓
Create Events         │    ✗      │   ✓   │    ✓    │   ✓   │    ✓
Edit Own Events       │    ✗      │   ✓   │    ✓    │   ✓   │    ✓
Delete Own Events     │    ✗      │   ✓   │    ✓    │   ✓   │    ✓
View Private Events   │    ✗      │   *   │    *    │   ✓   │    ✓
Send Messages         │    ✗      │   ✓   │    ✓    │   ✓   │    ✓
View User Profiles    │    ✗      │   ✓   │    ✓    │   ✓   │    ✓
Admin Dashboard       │    ✗      │   ✗   │    ✗    │   ✓   │    ✗
Payment Statistics    │    ✗      │   ✗   │    ✗    │   ✓   │    ✗
RSVP Management       │    ✗      │   ✗   │    ✗    │   ✓   │    ✓

* = Requires invitation or approval
```

### Middleware Implementation

```typescript
// Authentication middleware
export function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Admin authorization
export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Resource ownership check
async function checkOwnership(req, res, next) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, req.params.id)
  });
  
  if (event.creatorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
}
```

---

## Input Validation

### Zod Schema Validation

All API inputs are validated using Zod schemas before processing:

```typescript
// Example: Event creation validation
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  city: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  date: z.string().datetime(),
  category: z.enum(['Music', 'Art', 'Food', 'Tech', 'Social', 'Workshop']),
  price: z.string().regex(/^\d+(\.\d{2})?$/),
  ticketType: z.enum(['free', 'paid', 'donation']),
  capacity: z.number().int().positive().optional(),
});

// Validation in route
app.post('/api/events', requireAuth, async (req, res) => {
  const result = createEventSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: result.error.issues 
    });
  }
  // Process validated data
});
```

### SQL Injection Prevention

Drizzle ORM uses parameterized queries:

```typescript
// Safe - parameterized query
const user = await db.query.users.findFirst({
  where: eq(users.username, username)  // Automatically parameterized
});

// Never do this - string concatenation
// const user = await db.execute(`SELECT * FROM users WHERE username = '${username}'`);
```

---

## API Security

### Rate Limiting (Recommended)

Currently not implemented. Recommended configuration:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all routes
app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
```

### CORS Configuration

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5000',
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Security Headers (Recommended)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

---

## Payment Security

### Stripe Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STRIPE SECURITY MODEL                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. API Keys Never Exposed to Client
   ├── STRIPE_SECRET_KEY: Server-side only
   └── Publishable Key: Safe for frontend

2. Webhook Verification
   ├── STRIPE_WEBHOOK_SECRET: Validates authenticity
   └── stripe.webhooks.constructEvent(): Signature verification

3. PCI Compliance
   ├── Card data never touches our servers
   └── Stripe.js/Elements handle sensitive data

4. Connect Security
   ├── Express accounts: Host manages their own data
   └── Destination charges: Money flows directly
```

### Webhook Security

```typescript
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,      // Raw body (must use express.raw())
      sig,           // Stripe signature header
      webhookSecret  // Your webhook secret
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process verified event
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle payment
      break;
  }

  res.json({ received: true });
}
```

---

## Data Protection

### Sensitive Data Handling

| Data Type | Storage | Protection |
|-----------|---------|------------|
| Passwords | PostgreSQL | bcrypt hash (10 rounds) |
| Sessions | PostgreSQL | Encrypted session store |
| API Keys | Environment | Never in code/logs |
| Payment Data | Stripe | Never stored locally |
| User PII | PostgreSQL | Access-controlled |

### Database Security

```typescript
// Connection uses SSL in production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});
```

### Environment Variable Security

```
# .env (never committed)
DATABASE_URL=postgresql://...
SESSION_SECRET=<random-64-char-string>
JWT_SECRET=<random-64-char-string>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Best Practices:**
- All secrets in environment variables
- Different secrets for dev/staging/production
- Secrets rotated periodically
- `.env` in `.gitignore`

---

## File Upload Security

### Multer Configuration

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});
```

### Cloudinary Security

- Images processed through Cloudinary (not stored locally)
- Automatic malware scanning
- Secure URLs (HTTPS)
- Signed URLs for private assets

---

## Security Testing

### Implemented Tests

```
server/__tests__/
├── security.test.ts          # Security-focused tests
├── validation.test.ts        # Input validation tests
└── stripeConnect.test.ts     # Payment security tests
```

### Test Coverage

```typescript
// Security test examples
describe('Security Tests', () => {
  test('should reject unauthenticated requests', async () => {
    const res = await request(app).post('/api/events');
    expect(res.status).toBe(401);
  });

  test('should prevent SQL injection', async () => {
    const res = await request(app)
      .get('/api/users/username/' + "'; DROP TABLE users; --");
    expect(res.status).toBe(404); // Not vulnerable, just not found
  });

  test('should validate input schemas', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: '' }); // Invalid
    expect(res.status).toBe(400);
  });
});
```

---

## Security Checklist

### Implemented ✓

- [x] Password hashing with bcrypt
- [x] Session security (HttpOnly, Secure, SameSite)
- [x] JWT authentication for mobile
- [x] Input validation with Zod
- [x] SQL injection prevention (Drizzle ORM)
- [x] CORS configuration
- [x] Stripe webhook verification
- [x] File upload restrictions
- [x] Environment variable secrets
- [x] Authentication middleware
- [x] Authorization checks

### Recommended Improvements

- [ ] Rate limiting (express-rate-limit)
- [ ] Security headers (helmet.js)
- [ ] Content Security Policy
- [ ] HTTPS enforcement (HSTS)
- [ ] Request logging/monitoring
- [ ] Failed login attempt tracking
- [ ] Two-factor authentication (2FA)
- [ ] API key rotation policy
- [ ] Security audit logging
- [ ] Dependency vulnerability scanning

---

## Incident Response

### Security Contact

For security issues, contact the development team immediately.

### Response Procedure

1. **Identify**: Confirm the security issue
2. **Contain**: Disable affected features if needed
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix the vulnerability
5. **Notify**: Inform affected users if data breach
6. **Document**: Record incident for future prevention

---

## Compliance Considerations

### Data Privacy

- User data deletion endpoint available
- Profile data export capability
- Consent-based data collection
- Clear privacy policy

### Payment Compliance

- PCI-DSS: Handled by Stripe
- No card data stored locally
- Secure checkout flow
- Payment audit trail

### GDPR Considerations (if applicable)

- Right to access: Profile data accessible
- Right to deletion: Account deletion available
- Data portability: Export functionality
- Consent management: Preference settings
