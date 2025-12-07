# Maly System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MALY PLATFORM                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │    CDN/Edge     │
                              │   (Cloudinary)  │
                              └────────┬────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                                      │                                       │
│    ┌─────────────────────────────────▼─────────────────────────────────┐    │
│    │                         FRONTEND LAYER                             │    │
│    │                                                                    │    │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │    │
│    │  │   React     │  │  TanStack   │  │   Wouter    │  │ Zustand  │  │    │
│    │  │   18.3      │  │   Query     │  │   Router    │  │  State   │  │    │
│    │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │    │
│    │                                                                    │    │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │    │
│    │  │  Tailwind   │  │  Shadcn/UI  │  │   Framer    │                │    │
│    │  │    CSS      │  │  Components │  │   Motion    │                │    │
│    │  └─────────────┘  └─────────────┘  └─────────────┘                │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      │ HTTP/WebSocket                        │
│                                      ▼                                       │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │                         BACKEND LAYER                              │    │
│    │                                                                    │    │
│    │  ┌─────────────────────────────────────────────────────────────┐  │    │
│    │  │                    Express.js Server                         │  │    │
│    │  │                                                              │  │    │
│    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │    │
│    │  │  │  Routes  │  │Middleware│  │ Services │  │  WebSocket  │  │  │    │
│    │  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │  │    │
│    │  └─────────────────────────────────────────────────────────────┘  │    │
│    │                                                                    │    │
│    │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │    │
│    │  │   Passport.js    │  │     Drizzle      │  │      Zod       │  │    │
│    │  │   Authentication │  │       ORM        │  │   Validation   │  │    │
│    │  └──────────────────┘  └──────────────────┘  └────────────────┘  │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                                      │                                       │
│    ┌─────────────────────────────────▼─────────────────────────────────┐    │
│    │                          DATA LAYER                                │    │
│    │                                                                    │    │
│    │  ┌─────────────────────────────────────────────────────────────┐  │    │
│    │  │                    PostgreSQL (Neon)                         │  │    │
│    │  │                                                              │  │    │
│    │  │  Tables:                                                     │  │    │
│    │  │  • users              • events            • messages         │  │    │
│    │  │  • conversations      • eventParticipants • payments         │  │    │
│    │  │  • subscriptions      • ticketTiers       • userContacts     │  │    │
│    │  │  • invitations        • userCities        • pushSubscriptions│  │    │
│    │  └─────────────────────────────────────────────────────────────┘  │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                   │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Stripe    │  │ Cloudinary  │  │   Mapbox    │  │      OpenAI         │  │
│  │  Payments   │  │   Media     │  │  Geocoding  │  │    AI/Chat          │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐                                            │
│  │   Twilio    │  │  Web Push   │                                            │
│  │     SMS     │  │   (VAPID)   │                                            │
│  └─────────────┘  └─────────────┘                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Components

```
client/src/
├── components/
│   ├── ui/                    # Shadcn/UI base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── ... (50+ components)
│   │
│   ├── layout/                # Layout components
│   │   └── AdminSidebar.tsx
│   │
│   ├── checkout/              # Payment components
│   │   └── StripeCheckoutModal.tsx
│   │
│   ├── inbox/                 # Messaging components
│   │   ├── ConversationListItem.tsx
│   │   └── InboxSection.tsx
│   │
│   └── premium/               # Premium feature components
│       └── PaymentHistory.tsx
│
├── pages/                     # Route pages
│   ├── AuthPage.tsx           # Login/Register
│   ├── SignupFlowPage.tsx     # Multi-step signup
│   ├── DiscoverPage.tsx       # Event discovery
│   ├── EventPage.tsx          # Event details
│   ├── CreateEventFlowPage.tsx# Event creation wizard
│   ├── ProfilePage.tsx        # User profile
│   ├── InboxPage.tsx          # Messages
│   ├── ChatbotPage.tsx        # AI concierge
│   ├── ConnectPage.tsx        # User discovery
│   └── ... (30+ pages)
│
├── hooks/                     # Custom React hooks
│   ├── use-user.ts            # User state
│   ├── use-events.ts          # Events fetching
│   ├── use-messages.ts        # Messaging
│   ├── use-stripe-connect.ts  # Stripe Connect
│   └── use-toast.ts           # Notifications
│
├── lib/                       # Utilities
│   ├── translations.ts        # i18n (EN/ES)
│   ├── language-context.tsx   # Language provider
│   ├── theme-provider.tsx     # Dark/Light mode
│   ├── user-provider.tsx      # Auth context
│   ├── queryClient.ts         # TanStack Query setup
│   └── constants.ts           # App constants
│
└── services/
    └── websocket.ts           # WebSocket client
```

### Backend Components

```
server/
├── routes.ts                  # Main API routes (~5000 lines)
├── auth.ts                    # Authentication logic
├── chat.ts                    # AI chat handler
├── premium.ts                 # Premium subscriptions
├── stripeConnect.ts           # Stripe Connect integration
│
├── middleware/
│   ├── auth.middleware.ts     # Session auth middleware
│   ├── jwtAuth.ts             # JWT auth middleware
│   ├── adminAuth.ts           # Admin authorization
│   └── upload.ts              # Multer file upload
│
├── services/
│   ├── messagingService.ts    # Messaging logic
│   ├── eventsService.ts       # Event operations
│   ├── matchingService.ts     # User matching algorithm
│   ├── cloudinaryService.ts   # Image upload
│   ├── mapboxService.ts       # Geocoding
│   ├── pushNotificationService.ts # Push notifications
│   └── translationService.ts  # Text translation
│
├── lib/
│   ├── stripe.ts              # Stripe client
│   ├── cloudinary.ts          # Cloudinary client
│   ├── payments.ts            # Payment utilities
│   └── pg-pool.ts             # Database pool
│
├── validation/
│   └── schemas.ts             # Zod validation schemas
│
└── __tests__/                 # API tests
    ├── stripeConnect.test.ts
    ├── security.test.ts
    └── ... (10+ test files)
```

---

## Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │     events      │       │   ticketTiers   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ username        │  │    │ title           │  │    │ eventId (FK)────┼───┐
│ email           │  │    │ description     │  │    │ name            │   │
│ password (hash) │  │    │ city            │  │    │ price           │   │
│ fullName        │  │    │ location        │  │    │ quantity        │   │
│ profileImage    │  │    │ address         │  │    │ stripeProductId │   │
│ profileImages[] │  │    │ latitude        │  │    │ stripePriceId   │   │
│ bio             │  │    │ longitude       │  │    └─────────────────┘   │
│ location        │  │    │ date            │                             │
│ interests[]     │  │    │ endDate         │  ┌─────────────────────────┘
│ currentMoods[]  │  │    │ image           │  │
│ intention       │  │    │ category        │  │   ┌───────────────────┐
│ profession      │  │    │ creatorId (FK)──┼──┼───│ eventParticipants │
│ isPremium       │  │    │ capacity        │  │   ├───────────────────┤
│ isAdmin         │  │    │ price           │  │   │ id (PK)           │
│ stripeAccountId │  │    │ ticketType      │  │   │ eventId (FK)──────┤
│ stripeOnboarding│  │    │ isPrivate       │  │   │ userId (FK)───────┼──┐
│ preferredLang   │  │    │ isRsvp          │  │   │ ticketTierId (FK) │  │
│ referralCode    │  │    │ itinerary[]     │  │   │ status            │  │
└────────┬────────┘  │    │ dressCode       │  │   │ ticketQuantity    │  │
         │           │    └─────────────────┘  │   │ purchaseDate      │  │
         │           │                         │   │ paymentStatus     │  │
         │           │                         │   └───────────────────┘  │
         │           └─────────────────────────┘                          │
         │                                                                │
         └────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│  conversations  │       │conversationParticipants│    │    messages     │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ conversationId (FK) │───┐   │ id (PK)         │
│ title           │   │   │ userId (FK)         │   │   │ senderId (FK)   │
│ type (direct/   │   │   │ joinedAt            │   │   │ receiverId (FK) │
│       group/    │   │   │ lastReadAt          │   │   │ conversationId  │
│       event)    │   │   └─────────────────────┘   │   │ content         │
│ eventId (FK)    │   │                             │   │ isRead          │
│ createdBy (FK)  │   └─────────────────────────────┼───│ language        │
└─────────────────┘                                 │   └─────────────────┘
                                                    │
┌─────────────────┐       ┌─────────────────┐       │
│   userContacts  │       │   invitations   │       │
├─────────────────┤       ├─────────────────┤       │
│ ownerId (FK)    │       │ id (PK)         │       │
│ contactId (FK)  │       │ inviterId (FK)  │       │
│ createdAt       │       │ email           │       │
└─────────────────┘       │ code            │       │
                          │ status          │       │
┌─────────────────┐       │ inviteeId (FK)  │       │
│   userCities    │       └─────────────────┘       │
├─────────────────┤                                 │
│ id (PK)         │       ┌─────────────────┐       │
│ userId (FK)     │       │    payments     │       │
│ city            │       ├─────────────────┤       │
│ isCurrent       │       │ id (PK)         │       │
│ isPrimary       │       │ userId (FK)─────┼───────┘
│ email           │       │ eventParticipantId│
└─────────────────┘       │ stripeChargeId  │
                          │ stripeSessionId │
┌─────────────────┐       │ amount          │
│  subscriptions  │       │ currency        │
├─────────────────┤       │ status          │
│ id (PK)         │       └─────────────────┘
│ userId (FK)     │
│ stripeSubId     │       ┌─────────────────────┐
│ stripeCustomerId│       │ notificationPrefs   │
│ status          │       ├─────────────────────┤
│ currentPeriodEnd│       │ id (PK)             │
│ cancelAtPeriodEnd│      │ userId (FK)         │
│ subscriptionType│       │ inAppMessages       │
└─────────────────┘       │ pushMessages        │
                          │ inAppEvents         │
┌─────────────────┐       │ pushEvents          │
│subscriptionPayments│    └─────────────────────┘
├─────────────────┤
│ id (PK)         │       ┌─────────────────────┐
│ subscriptionId  │       │  pushSubscriptions  │
│ userId          │       ├─────────────────────┤
│ stripeInvoiceId │       │ id (PK)             │
│ amount          │       │ userId (FK)         │
│ status          │       │ endpoint            │
│ periodStart     │       │ p256dh              │
│ periodEnd       │       │ auth                │
└─────────────────┘       └─────────────────────┘
```

---

## Authentication Architecture

### Dual Authentication System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │         Authentication          │
                    │            Request              │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │        Check Auth Type          │
                    └────────────────┬────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      │                      ▼
    ┌─────────────────┐              │          ┌─────────────────┐
    │   WEB CLIENT    │              │          │  MOBILE CLIENT  │
    │ (Session-based) │              │          │   (JWT-based)   │
    └────────┬────────┘              │          └────────┬────────┘
             │                       │                   │
             ▼                       │                   ▼
    ┌─────────────────┐              │          ┌─────────────────┐
    │  express-session│              │          │  Authorization  │
    │  + passport.js  │              │          │  Bearer Token   │
    └────────┬────────┘              │          └────────┬────────┘
             │                       │                   │
             ▼                       │                   ▼
    ┌─────────────────┐              │          ┌─────────────────┐
    │ Session stored  │              │          │ JWT Verified    │
    │ in PostgreSQL   │              │          │ with secret     │
    │ (connect-pg-    │              │          │ (30-day expiry) │
    │  simple)        │              │          │                 │
    └────────┬────────┘              │          └────────┬────────┘
             │                       │                   │
             └───────────────────────┼───────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │        req.user populated       │
                    │        (user object)            │
                    └─────────────────────────────────┘
```

### Middleware Chain

```
Request → cors → body-parser → session → passport → authMiddleware → routes
                                  │
                                  ▼
                    ┌─────────────────────────────────┐
                    │      Middleware Options         │
                    ├─────────────────────────────────┤
                    │ 1. requireAuth (mandatory auth) │
                    │ 2. optionalAuth (user if avail) │
                    │ 3. requireAdmin (admin check)   │
                    │ 4. jwtAuth (mobile endpoints)   │
                    └─────────────────────────────────┘
```

---

## Service Layer Architecture

### Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │ messagingService │     │  eventsService   │     │ matchingService  │    │
│  ├──────────────────┤     ├──────────────────┤     ├──────────────────┤    │
│  │ - sendMessage    │     │ - createEvent    │     │ - findMatches    │    │
│  │ - getConversations│    │ - updateEvent    │     │ - scoreCompat    │    │
│  │ - createGroupChat│     │ - getEventImage  │     │ - filterByPrefs  │    │
│  │ - markAsRead     │     │ - filterEvents   │     │                  │    │
│  └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘    │
│           │                        │                         │              │
│           └────────────────────────┼─────────────────────────┘              │
│                                    │                                         │
│                                    ▼                                         │
│                    ┌───────────────────────────────┐                        │
│                    │         Database (db)         │                        │
│                    │        Drizzle ORM            │                        │
│                    └───────────────────────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │cloudinaryService │     │  mapboxService   │     │pushNotification  │    │
│  ├──────────────────┤     ├──────────────────┤     │    Service       │    │
│  │ - uploadImage    │     │ - getCoordinates │     ├──────────────────┤    │
│  │ - deleteImage    │     │ - reverseGeocode │     │ - sendPush       │    │
│  │ - optimizeImage  │     │                  │     │ - subscribe      │    │
│  └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘    │
│           │                        │                         │              │
│           ▼                        ▼                         ▼              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │   Cloudinary     │     │     Mapbox       │     │    Web Push      │    │
│  │      API         │     │      API         │     │    (VAPID)       │    │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Replit Deployment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REPLIT DEPLOYMENT                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           REPLIT CONTAINER                                   │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Node.js Process                                │  │
│  │                                                                        │  │
│  │   ┌─────────────────────────────────────────────────────────────┐     │  │
│  │   │              Express Server (Port 5000)                      │     │  │
│  │   │                                                              │     │  │
│  │   │   ┌────────────────┐    ┌────────────────────────────────┐  │     │  │
│  │   │   │  API Routes    │    │    Static Files (Vite Build)   │  │     │  │
│  │   │   │  /api/*        │    │    /*                          │  │     │  │
│  │   │   └────────────────┘    └────────────────────────────────┘  │     │  │
│  │   │                                                              │     │  │
│  │   │   ┌────────────────┐    ┌────────────────────────────────┐  │     │  │
│  │   │   │  WebSocket     │    │    Session Store               │  │     │  │
│  │   │   │  /ws/chat      │    │    (connect-pg-simple)         │  │     │  │
│  │   │   └────────────────┘    └────────────────────────────────┘  │     │  │
│  │   └──────────────────────────────────────────────────────────────┘     │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       │ DATABASE_URL
                                       ▼
                          ┌────────────────────────┐
                          │    PostgreSQL (Neon)   │
                          │   Managed by Replit    │
                          └────────────────────────┘
```

### Environment Variables

```
Required Environment Variables:
├── DATABASE_URL              # PostgreSQL connection string
├── SESSION_SECRET            # Express session secret
├── JWT_SECRET                # JWT signing secret
├── STRIPE_SECRET_KEY         # Stripe API key
├── STRIPE_WEBHOOK_SECRET     # Stripe webhook verification
├── STRIPE_CONNECT_WEBHOOK_SECRET
├── CLOUDINARY_CLOUD_NAME
├── CLOUDINARY_API_KEY
├── CLOUDINARY_API_SECRET
├── MAPBOX_ACCESS_TOKEN
├── OPENAI_API_KEY
├── VAPID_PUBLIC_KEY          # Web Push
├── VAPID_PRIVATE_KEY
└── APP_URL                   # Base URL for callbacks
```

---

## Scaling Considerations

### Current Architecture Limitations

1. **Single Process**: Node.js runs single-threaded
2. **In-Memory WebSocket**: No Redis for distributed WebSocket
3. **Session Storage**: PostgreSQL-based (good for moderate scale)

### Recommended Improvements for Scale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED SCALING ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   Load Balancer │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
    │   Node.js #1    │      │   Node.js #2    │      │   Node.js #3    │
    └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
             │                        │                        │
             └────────────────────────┼────────────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                          ▼                       ▼
                 ┌─────────────────┐     ┌─────────────────┐
                 │ Redis (Sessions │     │   PostgreSQL    │
                 │  + WebSocket)   │     │     (Neon)      │
                 └─────────────────┘     └─────────────────┘
```

### Performance Optimizations Implemented

1. **Database Indexing**: Key columns indexed for query performance
2. **Query Optimization**: N+1 queries fixed with proper joins
3. **Pagination**: All list endpoints support pagination
4. **Caching**: TanStack Query caches API responses client-side
5. **Image Optimization**: Cloudinary handles resizing/compression
