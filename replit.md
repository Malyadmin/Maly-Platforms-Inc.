# Maly - Social Networking Platform

## Overview

Maly is a comprehensive social networking platform designed to connect people in cities worldwide through events, connections, and AI-powered interactions. It aims to create a dynamic social experience focused on local community building and professional networking, combining modern web technologies with intelligent features. The platform facilitates event discovery and participation, user connections, and real-time communication, aiming to foster meaningful relationships within urban environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **Tailwind CSS** with **Shadcn/UI** for design
- **TanStack Query (React Query)** for data fetching and state management
- **Vite** for optimized builds
- **Zod** for runtime type validation

### Backend Architecture
- **Node.js/Express** server with TypeScript
- **PostgreSQL** database with **Drizzle ORM**
- **Passport.js** for authentication
- **Session-based authentication** with Express sessions and **JWT token-based authentication** for mobile
- **WebSocket** integration for real-time messaging
- **RESTful API** design pattern

### Data Storage Solutions
- **PostgreSQL** as primary database, utilizing **Drizzle ORM** for schema management.
- **JSONB** fields for flexible data (e.g., user moods, interests, event itineraries).
- **Replit Object Storage** for media files (profile images, event photos).

### Key Features
- **Authentication System**: Registration and login with username/email and password, password hashing with bcrypt, and authentication middleware for protected routes. Supports both session-based (web) and JWT token-based (mobile) authentication with 30-day expiration.
- **User Management**: Comprehensive user profiles, profile image uploads, user connections (follow/unfollow), and premium subscription tiers.
- **Events Platform**: Event creation with detailed information and itineraries, event discovery with filtering, participation, ticketing, and an RSVP system with automatic group chat creation for approved attendees.
- **Messaging System**: Advanced conversation-based messaging supporting both direct messages and group chats. Event-specific group chats are automatically created when hosts approve RSVP requests, enabling seamless communication among event attendees.
- **Social Features**: User browse and connection requests, interest and mood-based user matching, and city-based user discovery.
- **AI Integration**: Utilizes OpenAI API for intelligent event recommendations, AI-powered chat concierge, natural language processing for event queries, and compatibility scoring for user connections.
- **Payment System**: Complete Stripe integration with Express Connect for host payouts. Features include event ticketing, premium subscriptions, automatic 3% platform fee collection, direct payouts to host bank accounts, comprehensive webhook processing, and full E2E test coverage with 31 passing tests.

### UI/UX Decisions
- Consistent, accessible design using Tailwind CSS and Shadcn/UI.

### System Design Choices
- Modular architecture with clear separation of concerns (e.g., Stripe Connect functionality in `server/stripeConnect.ts`).
- Robust error handling with proper fallbacks and user feedback.
- Comprehensive input validation using Zod schemas.
- Performance optimization includes fixing N+1 query problems, pagination, and database indexing.

## Recent Changes (January 2025)

### Event Group Chat Implementation
- **Database Schema Migration**: Implemented conversation-based messaging system with new tables:
  - `conversations`: Supports both direct and group chats with event linking
  - `conversation_participants`: Join table for managing chat membership
  - Extended `messages` table with `conversationId` for group messaging support
- **Automatic Group Chat Creation**: Event hosts' RSVP approvals now automatically create and populate event-specific group chats
- **New API Endpoints**:
  - `POST /api/conversations/:conversationId/messages`: Send messages to conversations
  - `GET /api/conversations/:conversationId/messages`: Retrieve conversation messages
- **Enhanced Inbox System**: Updated to display both direct messages and event group chats with participant counts
- **Backward Compatibility**: Maintained legacy direct messaging endpoints for existing functionality

## External Dependencies

- **PostgreSQL**: Primary relational database.
- **OpenAI API**: For AI-powered features and recommendations.
- **Stripe**: Complete payment ecosystem with Express Connect accounts, automatic fee collection (3%), direct host payouts, webhook processing, and comprehensive test coverage.
- **Mapbox API**: Geographic coordinate conversion and location services (geocoding).
- **Cloudinary**: Centralized media upload service for images and videos.
- **Replit**: For development environment, deployment, and object storage.