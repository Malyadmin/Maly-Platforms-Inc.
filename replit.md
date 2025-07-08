# Maly - Social Networking Platform

## Overview

Maly is a comprehensive social networking platform designed to connect people in cities around the world through events, connections, and AI-powered interactions. It combines modern web technologies with intelligent features to create a dynamic social experience focused on local community building and professional networking.

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
- Session-based authentication with persistent storage
- Password hashing with bcrypt
- Authentication middleware for protected routes

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