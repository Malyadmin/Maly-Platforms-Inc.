# Event Creation & Management Database Schema

Complete database field documentation for event creation, management, and RSVP functionality in the Maly platform.

## Events Table (`events`)

### Required Fields

| Field Name | Type | Required | Description | Example Values |
|------------|------|----------|-------------|----------------|
| `title` | `text` | ✅ | Event title/name | "Tech Meetup Downtown", "Art Gallery Opening" |
| `description` | `text` | ✅ | Detailed event description | "Join us for an evening of networking and tech talks featuring industry leaders..." |
| `city` | `text` | ✅ | City where event takes place (for filtering) | "New York", "San Francisco", "Los Angeles" |
| `location` | `text` | ✅ | Specific venue or area within city | "Manhattan", "Downtown", "Brooklyn Heights" |
| `date` | `timestamp` | ✅ | Event start date and time | "2024-02-15T19:00:00Z" |
| `category` | `text` | ✅ | Event category/type | "Technology", "Art", "Music", "Networking", "Food & Drink" |
| `ticketType` | `text` | ✅ | Pricing model | "free", "paid", "donation" |

### Optional Fields

| Field Name | Type | Default | Description | Example Values |
|------------|------|---------|-------------|----------------|
| `address` | `text` | `null` | Exact street address | "123 Tech Street, New York, NY 10001" |
| `latitude` | `decimal(10,7)` | `null` | Geographic latitude for mapping | 40.7128000 |
| `longitude` | `decimal(10,7)` | `null` | Geographic longitude for mapping | -74.0060000 |
| `endDate` | `timestamp` | `null` | Event end time (for multi-day events) | "2024-02-16T22:00:00Z" |
| `image` | `text` | `null` | Cover image URL | "https://storage.example.com/events/cover.jpg" |
| `videoUrls` | `jsonb` | `[]` | Array of promotional video URLs | `["https://youtube.com/watch?v=xyz"]` |
| `capacity` | `integer` | `null` | Maximum number of attendees | 50, 100, 500 |
| `price` | `varchar` | `null` | Ticket price (string for flexibility) | "25.00", "Free", "Suggested $10" |
| `availableTickets` | `integer` | `null` | Number of tickets still available | 45 |
| `isPrivate` | `boolean` | `false` | Whether event is private/invite-only | `true`, `false` |
| `isBusinessEvent` | `boolean` | `false` | Whether this is a business/commercial event | `true`, `false` |
| `tags` | `jsonb` | `[]` | Event tags for enhanced filtering | `["networking", "beginner-friendly", "outdoor"]` |
| `attendingCount` | `integer` | `0` | Current number of confirmed attendees | 23 |
| `interestedCount` | `integer` | `0` | Number of users marked as interested | 45 |
| `timeFrame` | `text` | `null` | Quick time filter category | "Today", "This Week", "This Weekend", "This Month" |

### Payment Integration Fields

| Field Name | Type | Default | Description | Usage |
|------------|------|---------|-------------|-------|
| `stripeProductId` | `text` | `null` | Stripe product ID for paid events | Auto-generated when creating paid events |
| `stripePriceId` | `text` | `null` | Stripe price ID for tickets | Auto-generated for pricing |

### Auto-Generated Fields

| Field Name | Type | Auto-Generated | Description |
|------------|------|----------------|-------------|
| `id` | `serial` | ✅ | Unique event identifier (primary key) |
| `creatorId` | `integer` | ✅ | ID of user who created the event (from auth) |
| `createdAt` | `timestamp` | ✅ | When event was created |

### Event Itinerary Structure

The `itinerary` field is a JSONB array with the following structure:

```typescript
interface ItineraryItem {
  startTime: string;  // Format: "HH:MM" (e.g., "19:00")
  endTime: string;    // Format: "HH:MM" (e.g., "20:30")
  description: string; // Activity description
}
```

**Example Itinerary:**
```json
[
  {
    "startTime": "19:00",
    "endTime": "19:30",
    "description": "Welcome & Registration - Check-in and networking"
  },
  {
    "startTime": "19:30",
    "endTime": "20:15",
    "description": "Keynote Presentation - 'Future of AI in Development'"
  },
  {
    "startTime": "20:15",
    "endTime": "21:00",
    "description": "Panel Discussion - Q&A with industry experts"
  },
  {
    "startTime": "21:00",
    "endTime": "22:00",
    "description": "Networking Session - Connect with attendees"
  }
]
```

## Event Participants Table (`event_participants`)

### RSVP and Ticketing System

| Field Name | Type | Required | Description | Possible Values |
|------------|------|----------|-------------|-----------------|
| `eventId` | `integer` | ✅ | Reference to events table | Auto-set from URL parameter |
| `userId` | `integer` | ✅ | Reference to users table | Auto-set from authenticated user |
| `status` | `text` | ✅ | RSVP status | "pending_approval", "approved", "rejected", "attending", "interested", "not_attending" |
| `ticketQuantity` | `integer` | ✅ | Number of tickets requested | 1, 2, 3, etc. |

### Optional RSVP Fields

| Field Name | Type | Default | Description | Example Values |
|------------|------|---------|-------------|----------------|
| `purchaseDate` | `timestamp` | `null` | When tickets were purchased | Auto-set on payment completion |
| `ticketCode` | `text` | `null` | Unique ticket identifier | "TKT-ABC123-001" |
| `paymentStatus` | `text` | "pending" | Payment processing status | "pending", "completed", "refunded", "failed" |
| `paymentIntentId` | `text` | `null` | Stripe Payment Intent ID | "pi_1234567890abcdef" |
| `checkInStatus` | `boolean` | `false` | Whether attendee has checked in | `true`, `false` |
| `stripeCheckoutSessionId` | `text` | `null` | Stripe Checkout Session ID | "cs_1234567890abcdef" |
| `ticketIdentifier` | `text` | `null` | Unique QR code identifier | Auto-generated UUID |

### Auto-Generated Fields

| Field Name | Type | Auto-Generated | Description |
|------------|------|----------------|-------------|
| `id` | `serial` | ✅ | Unique participant record ID |
| `createdAt` | `timestamp` | ✅ | When RSVP was submitted |
| `updatedAt` | `timestamp` | ✅ | Last modification time |

## Event Creation API Request Format

### POST /api/events

**Required Fields in Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)", 
  "city": "string (required)",
  "location": "string (required)",
  "date": "ISO 8601 timestamp (required)",
  "category": "string (required)",
  "ticketType": "free|paid|donation (required)"
}
```

**Optional Fields in Request Body:**
```json
{
  "address": "string (optional)",
  "latitude": "number (optional)",
  "longitude": "number (optional)", 
  "endDate": "ISO 8601 timestamp (optional)",
  "image": "string URL (optional)",
  "videoUrls": ["string URLs (optional)"],
  "capacity": "number (optional)",
  "price": "string (optional, required if ticketType is 'paid')",
  "availableTickets": "number (optional)",
  "isPrivate": "boolean (optional, default: false)",
  "isBusinessEvent": "boolean (optional, default: false)",
  "tags": ["string array (optional)"],
  "timeFrame": "string (optional)",
  "itinerary": [
    {
      "startTime": "HH:MM",
      "endTime": "HH:MM", 
      "description": "string"
    }
  ]
}
```

### Complete Example Request

```json
{
  "title": "San Francisco Tech Meetup",
  "description": "Join us for an evening of networking and tech talks featuring industry leaders discussing the latest trends in AI, blockchain, and startup culture. Perfect for developers, entrepreneurs, and tech enthusiasts.",
  "city": "San Francisco",
  "location": "SOMA District",
  "address": "123 Technology Street, San Francisco, CA 94105",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "date": "2024-03-15T19:00:00Z",
  "endDate": "2024-03-15T22:00:00Z",
  "category": "Technology",
  "ticketType": "paid",
  "price": "25.00",
  "capacity": 50,
  "availableTickets": 50,
  "isPrivate": false,
  "isBusinessEvent": false,
  "tags": ["networking", "ai", "startups", "developers"],
  "timeFrame": "This Month",
  "itinerary": [
    {
      "startTime": "19:00",
      "endTime": "19:30",
      "description": "Registration & Welcome Drinks"
    },
    {
      "startTime": "19:30",
      "endTime": "20:15",
      "description": "Keynote: 'The Future of AI in Startups'"
    },
    {
      "startTime": "20:15",
      "endTime": "21:00",
      "description": "Panel Discussion: Building Tech Teams"
    },
    {
      "startTime": "21:00",
      "endTime": "22:00",
      "description": "Networking & Closing"
    }
  ]
}
```

## RSVP Creation API Request Format

### POST /api/events/:eventId/rsvp

**Required Fields in Request Body:**
```json
{
  "ticketQuantity": "number (required, minimum: 1)"
}
```

**Optional Fields in Request Body:**
```json
{
  "message": "string (optional) - Personal message to event host"
}
```

**Example RSVP Request:**
```json
{
  "ticketQuantity": 2,
  "message": "Excited to attend! Will be bringing a colleague who's also interested in AI."
}
```

## RSVP Approval/Rejection API

### PUT /api/events/:eventId/rsvp/:rsvpId

**Host-only endpoint for managing RSVP requests**

**Required Fields in Request Body:**
```json
{
  "status": "approved|rejected (required)"
}
```

**Example Approval:**
```json
{
  "status": "approved"
}
```

**Example Rejection:**
```json
{
  "status": "rejected"
}
```

## Validation Rules

### Event Creation Validation

1. **Title**: 1-200 characters, cannot be empty
2. **Description**: 10-5000 characters, cannot be empty  
3. **City**: Must be a valid city name, 1-100 characters
4. **Location**: 1-200 characters, cannot be empty
5. **Date**: Must be in the future, valid ISO 8601 timestamp
6. **Category**: Must be from predefined list or free-form text
7. **TicketType**: Must be exactly "free", "paid", or "donation"
8. **Price**: Required if ticketType is "paid", must be valid decimal
9. **Capacity**: Must be positive integer if provided
10. **Latitude/Longitude**: Must be valid coordinates if provided
11. **Itinerary**: Each item must have valid startTime, endTime, description

### RSVP Validation

1. **TicketQuantity**: Must be positive integer, cannot exceed available tickets
2. **EventId**: Must exist and be a valid event
3. **UserId**: Must be authenticated and valid user
4. **Duplicate Check**: User cannot have multiple pending RSVPs for same event

## Database Relationships

### Foreign Key Relationships

- `events.creatorId` → `users.id` (Event creator)
- `event_participants.eventId` → `events.id` (Participation record)
- `event_participants.userId` → `users.id` (Participating user)
- `conversations.eventId` → `events.id` (Event group chats)

### Automatic Group Chat Creation

When an RSVP is **approved** (`status` = "approved"):

1. **Group Chat Creation**: If no conversation exists for the event, create new conversation:
   ```sql
   INSERT INTO conversations (title, type, eventId, createdBy)
   VALUES ([Event Title], 'group', [eventId], [hostUserId])
   ```

2. **User Addition**: Add approved user to conversation:
   ```sql
   INSERT INTO conversation_participants (conversationId, userId, joinedAt)
   VALUES ([conversationId], [approvedUserId], NOW())
   ```

3. **Host Inclusion**: Ensure event host is in the conversation:
   ```sql
   INSERT INTO conversation_participants (conversationId, userId, joinedAt)
   VALUES ([conversationId], [hostUserId], NOW())
   ON CONFLICT DO NOTHING
   ```

## Performance Considerations

### Database Indexing

Recommended indexes for optimal performance:

```sql
-- Event filtering and search
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_creator ON events(creatorId);
CREATE INDEX idx_events_private ON events(isPrivate);

-- RSVP management
CREATE INDEX idx_participants_event ON event_participants(eventId);
CREATE INDEX idx_participants_user ON event_participants(userId);
CREATE INDEX idx_participants_status ON event_participants(status);

-- Group chat relationships
CREATE INDEX idx_conversations_event ON conversations(eventId);
CREATE INDEX idx_conv_participants_conv ON conversation_participants(conversationId);
CREATE INDEX idx_conv_participants_user ON conversation_participants(userId);
```

### Query Optimization

- Use pagination for event listings (`LIMIT` and `OFFSET`)
- Filter events by date ranges to avoid full table scans
- Use JSONB operators efficiently for itinerary and tags queries
- Implement proper connection pooling for database access

## Error Handling

### Common Validation Errors

| Error Code | Message | Resolution |
|------------|---------|------------|
| 400 | "Title is required" | Provide non-empty title |
| 400 | "Date must be in the future" | Use future timestamp |
| 400 | "Price required for paid events" | Set price for paid ticketType |
| 400 | "Invalid ticket quantity" | Use positive integer |
| 403 | "Only event host can approve RSVPs" | Ensure user is event creator |
| 404 | "Event not found" | Verify eventId exists |
| 409 | "User already has pending RSVP" | Check existing RSVP status |

### Database Constraint Errors

| Constraint | Error Handling | User Message |
|------------|----------------|--------------|
| Foreign Key | Event/User not found | "Invalid event or user ID" |
| Unique | Duplicate entry | "Entry already exists" |
| Not Null | Missing required field | "Required field cannot be empty" |
| Check | Invalid enum value | "Invalid status value" |

This schema documentation provides complete field specifications for implementing event creation, management, and RSVP functionality with automatic group chat integration.