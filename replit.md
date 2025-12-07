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
- Premium verification badge displayed next to user names in Connect view and Profile view for premium users.

### System Design Choices
- Modular architecture with clear separation of concerns (e.g., Stripe Connect functionality in `server/stripeConnect.ts`).
- Robust error handling with proper fallbacks and user feedback.
- Comprehensive input validation using Zod schemas.
- Performance optimization includes fixing N+1 query problems, pagination, and database indexing.

## Recent Changes (December 2025)

### Typography & Branding Update (December 7, 2025)
- **Monochrome Color Palette**: Implemented luxury-tech aesthetic with clean monochrome design
  - Primary text: #FFFFFF (pure white)
  - Secondary text: rgba(255,255,255,0.75)
  - Meta text: rgba(255,255,255,0.55)
  - Accent color: #B57CFF (used sparingly, no gradients)
  - Backgrounds: #0D0D0D to #171717
- **Typography System**: Added Inter font with consistent typography tokens
  - Page titles: 30px Light, uppercase, letter-spacing +5%
  - Section labels: 14px Medium, uppercase
  - Event titles: 16px Medium
  - Event meta: 13px Regular
  - Navigation labels: 11px Regular
  - Button text: 14px Medium, uppercase
- **Spacing System**: Consistent spacing variables
  - Text stack: 4-6px
  - Between cards: 20px
  - Between sections: 32px
  - Page padding: 20px
- **Component Updates**: 
  - `button.tsx` - Removed gradients, solid color buttons
  - `bottom-nav.tsx` - Updated nav label sizing (11px)
  - `page-header.tsx` - Updated page title styling (28-32px Light)
  - `event-card.tsx` / `ios-event-card.tsx` - Updated typography and spacing
  - `layout.tsx` - Removed gradient inbox icon

### Loading Experience Improvements (December 6, 2025)
- **Branded Splash Screen**: Animated MALY logo with gradient background displays on app launch for 2 seconds with smooth fade-out transition
- **Skeleton Loaders**: Created reusable skeleton components (EventGridSkeleton, ProfileGridSkeleton, InboxSkeleton) for improved loading states
- **Page Transitions**: Implemented smooth slide/fade animations using Framer Motion for all route changes
- **Component Files**: 
  - `client/src/components/ui/splash-screen.tsx` - Branded splash with animation
  - `client/src/components/ui/page-transition.tsx` - Framer Motion page wrapper
  - `client/src/components/ui/content-skeleton.tsx` - Reusable skeleton components

### Signup Flow Redesign (December 5, 2025)
- **5-Step Registration Flow**: Comprehensive multi-step signup with mandatory/optional field distinctions:
  - Step 1 (Basic Account): Full Name, Username, Email, Password, Confirm Password (required), Phone Number (optional)
  - Step 2 (Demographics): Age, Gender (required), Sexual Orientation (optional)
  - Step 3 (Locations): Current Location (required), Born In, Lived In, Next Location (optional)
  - Step 4 (Preferences): Vibes minimum 2, Intention minimum 1 (required), Profession (optional)
  - Step 5 (Profile Completion): Profile Photo, Terms & Privacy acceptance (required), Bio (optional)
- **Visual Indicators**: "* Optional" labels clearly mark non-required fields
- **Step-Specific Instructions**: Each step includes encouraging instruction copy in both English and Spanish
- **Validation**: Zod schema validation enforces all mandatory field requirements
- **Post-Onboarding Welcome**: New users see a celebratory welcome modal upon first Discover page visit after registration
- **Translation Coverage**: 40+ new translation keys added for complete bilingual support

## Recent Changes (November 2025)

### Appearance Settings & Light Mode (November 10, 2025)
- **Theme Selection**: Implemented comprehensive theme switching system with dark/light/system modes
- **Appearance Page**: User-facing settings page at `/appearance` accessible from hamburger menu
- **Light Mode Support**: Full light mode implementation with CSS variables in index.css:
  - Light mode: White backgrounds with dark text, white navigation with black icons
  - Dark mode: Black backgrounds with light text, black navigation with white icons
  - System mode: Automatically follows device theme preferences with live change detection
- **Component Updates**: All major components (navigation, headers, cards, dialogs, dropdowns) now use CSS variables for proper theme adaptation
- **Theme Persistence**: User's theme preference saved to localStorage and persists across sessions
- **Responsive Switching**: Seamless transitions between themes with smooth color animations
- **Accessibility**: Improved contrast ratios with updated accent colors for better hover state visibility

### Push Notification System (November 9, 2025)
- **Complete Push Notification Infrastructure**: Implemented comprehensive web push notification system with:
  - Database schema: `notification_preferences` and `push_subscriptions` tables
  - Push notification service using web-push library with VAPID keys
  - Service worker for handling notifications when app is closed
- **Notification Preferences Page**: User-facing UI at `/notification-preferences` with toggles for in-app and push notifications
- **Message Notifications**: Integrated into sendMessageToConversation() - sends push notifications to all conversation participants
- **RSVP Notifications**: Integrated into application approval/decline flow - notifies applicants of status changes
- **Ticket Purchase Notifications**: Integrated into Stripe webhook - confirms ticket purchases with push notifications
- **Event Matching Notifications**: Integrated into event creation - notifies users in same city with matching vibes when new events are created
- **Documentation**: Complete setup guide in NOTIFICATION_SETUP.md with VAPID key generation and deployment instructions

## Recent Changes (November 2025)

### Premium Verification Badge (November 8, 2025)
- **Visual Premium Indicator**: Premium users now display a custom verification badge (Maly logo) next to their names
- **Connect Page Integration**: Badge appears in user cards next to full name in the main user grid
- **Profile Page Integration**: Badge appears next to name overlay on profile images
- **Type Safety**: Added `isPremium` field to ConnectUser and ProfileData interfaces

### PWA Layout Improvements (November 8, 2025)
- **Fixed Header Scrolling**: All main pages (Inbox, Events, Profile, Connect) now have fixed headers with only content scrolling
- **iOS Status Bar**: Changed to black style to better hide time/battery indicators in PWA mode
- **Premium User Status**: All existing users upgraded to premium status

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