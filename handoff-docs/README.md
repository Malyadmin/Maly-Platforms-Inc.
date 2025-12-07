# Maly Platform - Handoff Documentation

## Overview

This folder contains comprehensive technical and user documentation for the Maly social networking platform. These documents are designed for due diligence, developer onboarding, and platform understanding.

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [API Documentation](./01-API-DOCUMENTATION.md) | Complete REST API reference with endpoints, request/response formats, and authentication |
| 02 | [Tech Stack Overview](./02-TECH-STACK-OVERVIEW.md) | Full technology stack with versions, libraries, and project structure |
| 03 | [Data Flow Diagrams](./03-DATA-FLOW-DIAGRAMS.md) | Visual diagrams showing how data moves through the system |
| 04 | [System Architecture](./04-SYSTEM-ARCHITECTURE.md) | High-level architecture, component design, and database schema |
| 05 | [Security Overview](./05-SECURITY-OVERVIEW.md) | Security measures, authentication, and best practices |
| 06 | [Stripe Financial Flow](./06-STRIPE-FINANCIAL-FLOW.md) | Payment processing, Stripe Connect, and fee structure |
| 07 | [User Manual](./07-USER-MANUAL.md) | End-user guide for all platform features |

---

## Quick Links

### For Developers
- [API Documentation](./01-API-DOCUMENTATION.md) - Start here to understand the API
- [Tech Stack](./02-TECH-STACK-OVERVIEW.md) - Technology choices and dependencies
- [System Architecture](./04-SYSTEM-ARCHITECTURE.md) - How the system is built

### For Security Review
- [Security Overview](./05-SECURITY-OVERVIEW.md) - Security implementation details

### For Business/Financial Review
- [Stripe Financial Flow](./06-STRIPE-FINANCIAL-FLOW.md) - Payment and revenue model

### For Product Understanding
- [User Manual](./07-USER-MANUAL.md) - How users interact with the platform
- [Data Flow Diagrams](./03-DATA-FLOW-DIAGRAMS.md) - User journey flows

---

## Platform Summary

**Maly** is a full-stack social networking platform featuring:

- **Event Discovery & Creation** - Find and host local events
- **User Connections** - Connect with people in your city
- **Real-time Messaging** - Direct and group chat functionality
- **AI Concierge** - Natural language event discovery
- **Payment Processing** - Stripe integration with Connect payouts
- **Premium Subscriptions** - Enhanced features for subscribers
- **Bilingual Support** - Full English/Spanish localization

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe (Connect for payouts)
- **AI**: OpenAI API
- **Deployment**: Replit

---

## Getting Started for Developers

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (see Tech Stack doc for list)
4. **Run database migrations**: `npm run db:push`
5. **Start development server**: `npm run dev`

---

## Document Maintenance

These documents should be updated when:
- New API endpoints are added
- Major architectural changes occur
- Security policies change
- New features are added
- Payment flow modifications

Last Updated: December 2025
