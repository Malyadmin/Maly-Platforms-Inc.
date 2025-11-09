# Push Notification Setup Guide

## Overview
Maly now has full push notification support with the following features:
- ✅ In-app and push notifications for messages, events, RSVPs, and tickets
- ✅ User preferences page for controlling notification settings
- ✅ Web Push API integration for real-time mobile notifications
- ✅ Service worker for handling push notifications when app is closed

## Setup Instructions

### 1. Generate VAPID Keys
Run the following command to generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

### 2. Add Environment Variables
Add the generated keys to your `.env` file:
```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:support@maly.app
```

### 3. Register Service Worker
The service worker is automatically registered when the app loads. It's located at `/public/service-worker.js`.

## Implementation Status

### ✅ Completed
1. **Database Schema**
   - `notification_preferences` table for user preferences
   - `push_subscriptions` table for device subscriptions

2. **API Routes**
   - `GET /api/notifications/preferences` - Get user preferences
   - `PUT /api/notifications/preferences` - Update preferences
   - `GET /api/notifications/vapid-key` - Get public VAPID key
   - `POST /api/notifications/subscribe` - Save push subscription

3. **Push Notification Service**
   - `sendMessageNotification()` - For new messages
   - `sendEventNotification()` - For new matching events
   - `sendRSVPNotification()` - For RSVP updates
   - `sendTicketConfirmation()` - For ticket purchases

4. **UI Components**
   - Notification Preferences page (`/notification-preferences`)
   - Toggle controls for in-app and push notifications
   - Permission request handling
   - Service worker registration

5. **Integrations**
   - ✅ Messages: Integrated in `server/services/messagingService.ts`
   - ⏳ RSVPs: Add to `/api/events/:eventId/applications/:userId` endpoint
   - ⏳ Tickets: Add to Stripe webhook `checkout.session.completed`
   - ⏳ Events: Add to event creation endpoint with vibe/city matching

### ⏳ Remaining Integrations

#### RSVP Notifications
Add to `server/routes.ts` around line 4900 in the `/api/events/:eventId/applications/:userId` endpoint:

```typescript
import { sendRSVPNotification } from './services/pushNotificationService';

// After updating application status
if (status === 'approved') {
  await sendRSVPNotification(userIdNum, existingEvent.title, 'approved');
} else if (status === 'declined') {
  await sendRSVPNotification(userIdNum, existingEvent.title, 'declined');
}
```

#### Ticket Purchase Notifications
Add to `server/routes.ts` around line 3650 in the Stripe webhook handler:

```typescript
import { sendTicketConfirmation } from './services/pushNotificationService';

// After successful ticket purchase (in checkout.session.completed handler)
await sendTicketConfirmation(userId, eventData.title, quantity);
```

#### Event Matching Notifications
Add to `server/routes.ts` after event creation (around line 2080):

```typescript
import { sendEventNotification } from './services/pushNotificationService';
import { users } from '../db/schema';

// After event is created successfully
try {
  // Find users in the same city with matching vibes
  const matchingUsers = await db.query.users.findMany({
    where: and(
      eq(users.location, eventData.city),
      // Add vibe matching logic here based on your matching service
    )
  });

  for (const user of matchingUsers) {
    await sendEventNotification(user.id, eventData.title, eventData.city);
  }
} catch (error) {
  console.error('Error notifying matching users:', error);
}
```

## Testing

### Local Testing
1. Enable HTTPS (required for push notifications):
   ```bash
   # Use ngrok or similar to get HTTPS
   ngrok http 5000
   ```

2. Open the notification preferences page
3. Enable push notifications for a category
4. Trigger an action (send message, create event, etc.)
5. Check browser notifications

### Mobile Testing
1. Deploy to a production domain with HTTPS
2. Open the app on mobile device
3. Enable push notifications
4. Test receiving notifications when app is closed

## Security Considerations
- VAPID private key must be kept secret
- Push subscriptions are user-specific
- Notifications respect user preferences
- Invalid subscriptions are automatically removed

## Troubleshooting

### Push Notifications Not Working
1. Check VAPID keys are set in environment variables
2. Verify service worker is registered (check DevTools > Application > Service Workers)
3. Ensure HTTPS is enabled (required for push notifications)
4. Check browser console for errors
5. Verify notification permissions are granted

### Subscription Failures
1. Check that the VAPID public key matches the private key
2. Ensure the service worker has the correct scope
3. Verify browser supports push notifications

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support  
- Safari (iOS 16.4+): ✅ Full support
- Opera: ✅ Full support

## Production Deployment Checklist
- [ ] Generate and configure VAPID keys
- [ ] Deploy service worker to production
- [ ] Enable HTTPS on domain
- [ ] Test push notifications on mobile devices
- [ ] Monitor push notification delivery rates
- [ ] Set up error tracking for failed notifications
