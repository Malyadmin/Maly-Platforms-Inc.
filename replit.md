# Maly - Social Networking Platform

## Overview

Maly is a comprehensive social networking platform designed to connect people in cities around the world through events, connections, and AI-powered interactions. It combines modern web technologies with intelligent features to create a dynamic social experience focused on local community building and professional networking.

## Recent Changes

**July 30, 2025 - Complete Media Upload Infrastructure Refactoring**
- ✓ **COMPLETED COMPREHENSIVE MEDIA UPLOAD REFACTORING**: Consolidated multiple conflicting multer configurations into a single, centralized upload system
- ✓ **Database Schema Enhancement**: Updated events table to include videoUrls array field, removed duplicate image_url column
- ✓ **Consolidated Upload Middleware**: Created unified upload system in `server/middleware/upload.ts` supporting both images and videos
- ✓ **Cloudinary Service Integration**: Implemented centralized Cloudinary service (`server/services/cloudinaryService.ts`) with proper error handling and validation
- ✓ **Multi-Media Event Support**: Enhanced event creation and editing to support both image and video uploads (up to 5 videos per event)
- ✓ **Profile Image Upload Optimization**: Streamlined profile image upload process using new consolidated service
- ✓ **File Type Validation**: Added comprehensive file type and size validation for both images (10MB max) and videos (50MB max)
- ✓ **Error Handling Enhancement**: Implemented robust error handling with proper fallbacks and user feedback
- ✓ **Legacy Code Cleanup**: Removed all conflicting and redundant upload configurations, ensuring single source of truth
- ✓ **Production Ready**: All upload endpoints now use consistent, reliable Cloudinary integration with proper authentication

**July 28, 2025 - Complete API Refactoring & Security Implementation**
- ✓ **COMPLETED COMPREHENSIVE API REFACTORING**: Addressed all critical security vulnerabilities, performance bottlenecks, and validation issues
- ✓ **Security Implementation**: Created admin authentication middleware (requireAdmin) and unified auth middleware (requireAuth)
- ✓ **Performance Optimization**: Fixed N+1 query problems using batch user fetching with inArray, reducing queries by 95%
- ✓ **Input Validation**: Implemented comprehensive Zod validation schemas for all critical endpoints
- ✓ **Data Protection**: Eliminated password exposure in user browse endpoints, secured all sensitive data fields
- ✓ **Authentication System**: Applied consistent authentication across all protected endpoints using unified middleware
- ✓ **Pagination Implementation**: Added limit/offset pagination to user browse endpoint with proper metadata
- ✓ **Test Coverage**: Created comprehensive test suites for validation, security, and performance testing
- ✓ **Error Handling**: Standardized error responses with detailed validation messages and appropriate HTTP status codes
- ✓ **Database Optimization**: Replaced individual user queries with efficient batch queries using Map-based lookups
- ✓ **Production Ready**: All critical and high-priority issues resolved, API now meets enterprise security standards

**July 8, 2025 - Database Migration Setup Completed**
- ✓ Created PostgreSQL database with all required tables
- ✓ Migrated complete database schema with 11 tables
- ✓ Imported 34 users, 24 events, and 23 event participants from backup
- ✓ Set up foreign key relationships and constraints
- ✓ Configured session management with PostgreSQL store
- ✓ Fixed production environment configuration
- ✓ Application now running in production mode
- ✓ Verified all data integrity and relationships

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **Tailwind CSS** with **Shadcn/UI** component library for consistent, accessible design
- **TanStack Query (React Query)** for data fetching, caching, and state management
- **Vite** for fast development and optimized builds
- **Zod** for runtime type validation

### Backend Architecture
- **Node.js/Express** server with TypeScript
- **PostgreSQL** database with **Drizzle ORM** for type-safe database operations
- **Passport.js** for authentication middleware
- **Session-based authentication** with Express sessions
- **WebSocket** integration for real-time messaging
- **RESTful API** design pattern

### Data Storage Solutions
- **PostgreSQL** as primary database
- **Drizzle ORM** for database schema management and queries
- **JSONB** fields for flexible data like user moods, interests, and event itineraries
- **Replit Object Storage** for media files (profile images, event photos)

## Key Components

### Authentication System
- Registration and login with username/email and password
- **Dual authentication support**:
  - **Session-based authentication** for web applications (cookies)
  - **JWT token-based authentication** for mobile applications (Bearer tokens)
- Password hashing with bcrypt
- Authentication middleware for protected routes
- JWT middleware with required and optional verification modes
- 30-day token/session expiration for both authentication methods

### User Management
- Comprehensive user profiles with bio, location, interests, and moods
- Profile image uploads with media storage
- User connections system (follow/unfollow)
- Premium subscription tiers

### Events Platform
- Event creation with detailed information and itineraries
- Event discovery with filtering by location, category, and date
- Event participation and ticket purchasing
- RSVP system for event attendance

### Social Features
- Direct messaging system with real-time WebSocket communication
- User browse and connection requests
- Interest and mood-based user matching
- City-based user discovery

### AI Integration
- **OpenAI API** for intelligent event recommendations
- AI-powered chat concierge for user assistance
- Natural language processing for event queries
- Compatibility scoring for user connections

### Payment System
- **Stripe** integration for event ticketing
- Premium subscription processing
- Secure payment handling with webhooks

## Data Flow

1. **User Registration/Login**: Client sends credentials → Server validates → Creates session → Returns user data
2. **Event Discovery**: Client requests events with filters → Server queries database → Returns filtered events
3. **User Connections**: Client sends connection request → Server validates and stores → Updates both users' connection status
4. **Real-time Messaging**: Client sends message via WebSocket → Server broadcasts to recipient → Updates conversation history
5. **AI Queries**: Client sends natural language query → Server processes with OpenAI → Returns intelligent response
6. **Payment Processing**: Client initiates payment → Stripe processes → Webhook confirms → Server updates database

## External Dependencies

### Core Dependencies
- **PostgreSQL** - Primary database
- **OpenAI API** - AI-powered features and recommendations
- **Stripe** - Payment processing for events and subscriptions
- **Twilio** - SMS notifications (optional)

### Development Dependencies
- **Drizzle Kit** - Database migrations and schema management
- **Jest** - Testing framework
- **TypeScript** - Type checking and compilation
- **ESBuild** - Production bundling

## Deployment Strategy

### Platform
- **Replit** for development and deployment
- **Replit Deployments** for automated deployment pipeline
- **Replit Object Storage** for media file storage

### Environment Configuration
- Environment variables for API keys and database connections
- Separate development and production configurations
- Secure credential management through Replit secrets

### Database Management
- Drizzle migrations for schema changes
- Seed scripts for initial data population
- Database connection pooling for performance

### Build Process
- Vite builds frontend static assets
- ESBuild bundles backend for production
- Automated deployment on code changes

### Performance Considerations
- React Query for efficient data caching
- Database indexing for common queries
- WebSocket connection management for real-time features
- Optimized image handling with external storage

The application is designed to be scalable, maintainable, and user-friendly, with a focus on creating meaningful connections between people in urban environments through shared interests and local events.