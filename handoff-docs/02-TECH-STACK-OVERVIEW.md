# Maly Tech Stack Overview

## Summary

Maly is a full-stack TypeScript application built with modern web technologies, featuring a React frontend and Node.js/Express backend, backed by PostgreSQL with Drizzle ORM.

---

## Frontend Technologies

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.6.3 | Type-safe JavaScript |
| **Vite** | 6.2.5 | Build tool & dev server |

### Routing & State Management
| Technology | Version | Purpose |
|------------|---------|---------|
| **Wouter** | 3.6.0 | Lightweight client-side routing |
| **TanStack Query** | 5.67.1 | Server state management & caching |
| **Zustand** | 5.0.3 | Client state management |
| **React Hook Form** | 7.53.1 | Form handling |

### UI Components & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS |
| **Shadcn/UI** | (Radix-based) | Accessible component library |
| **Radix UI** | Various | Headless UI primitives |
| **Lucide React** | 0.453.0 | Icon library |
| **Framer Motion** | 11.13.1 | Animation library |
| **React Icons** | 5.4.0 | Additional icons (brand logos) |

### Forms & Validation
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zod** | 3.23.8 | Runtime type validation |
| **@hookform/resolvers** | 3.9.1 | Form validation integration |
| **Drizzle-Zod** | 0.6.0 | Database schema to Zod conversion |

### Data Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 2.13.0 | Charts and graphs |
| **Embla Carousel** | 8.3.0 | Touch-friendly carousels |

### Payments
| Technology | Version | Purpose |
|------------|---------|---------|
| **@stripe/react-stripe-js** | 3.6.0 | Stripe React components |
| **@stripe/stripe-js** | 7.0.0 | Stripe JavaScript SDK |

### Maps & Location
| Technology | Version | Purpose |
|------------|---------|---------|
| **Mapbox GL** | 3.9.1 | Interactive maps |

---

## Backend Technologies

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime |
| **Express** | 4.21.2 | Web framework |
| **TypeScript** | 5.6.3 | Type-safe JavaScript |
| **TSX** | 4.19.1 | TypeScript execution |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | (Neon-backed) | Primary database |
| **Drizzle ORM** | 0.38.2 | Type-safe ORM |
| **Drizzle Kit** | 0.30.6 | Database migrations |
| **pg** | 8.15.1 | PostgreSQL client |

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| **Passport.js** | 0.7.0 | Authentication middleware |
| **passport-local** | 1.0.0 | Local auth strategy |
| **bcrypt** | 5.1.1 | Password hashing |
| **jsonwebtoken** | 9.0.2 | JWT tokens (mobile auth) |
| **express-session** | 1.18.1 | Session management |
| **connect-pg-simple** | 10.0.0 | PostgreSQL session store |

### Payments
| Technology | Version | Purpose |
|------------|---------|---------|
| **Stripe** | 18.4.0 | Payment processing |

### AI & NLP
| Technology | Version | Purpose |
|------------|---------|---------|
| **OpenAI** | 4.100.0 | AI chat & recommendations |
| **@anthropic-ai/sdk** | 0.33.1 | Alternative AI provider |

### Real-time Communication
| Technology | Version | Purpose |
|------------|---------|---------|
| **ws** | 8.18.0 | WebSocket server |
| **web-push** | 3.6.7 | Push notifications |

### File Uploads & Media
| Technology | Version | Purpose |
|------------|---------|---------|
| **Multer** | 1.4.5-lts.1 | File upload handling |
| **Cloudinary** | 2.6.0 | Cloud media storage |
| **QRCode** | 1.5.4 | QR code generation |

### External Services
| Technology | Version | Purpose |
|------------|---------|---------|
| **@mapbox/mapbox-sdk** | 0.16.1 | Geocoding services |
| **Twilio** | 5.4.5 | SMS notifications |
| **Axios** | 1.9.0 | HTTP client |

---

## Development Tools

### Build & Bundling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 6.2.5 | Frontend bundler |
| **esbuild** | 0.25.2 | Backend bundler |
| **PostCSS** | 8.4.47 | CSS processing |
| **Autoprefixer** | 10.4.20 | CSS vendor prefixes |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Jest** | 29.7.0 | Test framework |
| **ts-jest** | 29.2.6 | TypeScript Jest support |
| **Supertest** | 7.1.4 | HTTP testing |

### Code Quality
| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | 5.6.3 | Static type checking |

---

## Infrastructure

### Hosting & Deployment
- **Replit** - Development environment & deployment platform
- **Neon** - Managed PostgreSQL (via Replit integration)

### External Services
| Service | Purpose |
|---------|---------|
| **Stripe** | Payment processing & Connect payouts |
| **Cloudinary** | Image/video storage & CDN |
| **Mapbox** | Geocoding & maps |
| **OpenAI** | AI-powered features |
| **Twilio** | SMS notifications (optional) |

---

## Project Structure

```
maly/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities & providers
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── index.html
├── server/                 # Backend application
│   ├── __tests__/          # API tests
│   ├── config/             # Configuration files
│   ├── lib/                # Utility libraries
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   ├── validation/         # Request validation
│   ├── routes.ts           # API routes
│   ├── auth.ts             # Authentication
│   ├── chat.ts             # AI chat handler
│   ├── premium.ts          # Premium subscriptions
│   └── stripeConnect.ts    # Stripe Connect
├── db/                     # Database
│   ├── schema.ts           # Drizzle schema
│   ├── index.ts            # DB connection
│   └── seed.ts             # Seed data
├── handoff-docs/           # Documentation
└── package.json
```

---

## Key Architecture Decisions

1. **Monorepo Structure**: Frontend and backend in single repository for easier development and deployment.

2. **Type Sharing**: Database schema types shared between frontend and backend via `db/schema.ts`.

3. **Session + JWT Auth**: Web uses session-based auth, mobile apps use JWT tokens for flexibility.

4. **Drizzle ORM**: Chosen for type-safe database operations and excellent TypeScript support.

5. **TanStack Query**: Server state management with automatic caching, reducing API calls.

6. **Stripe Connect**: Express accounts for event host payouts with 3% platform fee.

7. **Cloudinary**: Centralized media handling for consistent image optimization and CDN delivery.

8. **Bilingual Support**: Full English/Spanish translation system built into the frontend.
