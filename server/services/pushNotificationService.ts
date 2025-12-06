import webpush from 'web-push';
import { db } from '../../db';
import { pushSubscriptions, notificationPreferences } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

// Generate VAPID keys with: npx web-push generate-vapid-keys
const rawPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const rawPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

// Clean up VAPID keys - remove any quotes, whitespace, or equals padding
const VAPID_PUBLIC_KEY = rawPublicKey.trim().replace(/^["']|["']$/g, '').replace(/=+$/, '');
const VAPID_PRIVATE_KEY = rawPrivateKey.trim().replace(/^["']|["']$/g, '').replace(/=+$/, '');
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@maly.app';

console.log(`[VAPID] Public key length: ${VAPID_PUBLIC_KEY.length}, first 20 chars: ${VAPID_PUBLIC_KEY.substring(0, 20)}`);
console.log(`[VAPID] Private key length: ${VAPID_PRIVATE_KEY.length}`);

let pushNotificationsEnabled = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY.length > 50) {
  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    pushNotificationsEnabled = true;
    console.log('✓ Push notifications configured with VAPID keys');
  } catch (error: any) {
    console.error('⚠ Failed to configure VAPID keys:', error.message);
    console.error('  Raw public key:', rawPublicKey.substring(0, 30) + '...');
    console.error('  Cleaned public key:', VAPID_PUBLIC_KEY.substring(0, 30) + '...');
  }
} else {
  console.warn('⚠ VAPID keys not configured or invalid. Push notifications will not work.');
  console.warn(`  Public key present: ${!!VAPID_PUBLIC_KEY}, length: ${VAPID_PUBLIC_KEY.length}`);
  console.warn(`  Private key present: ${!!VAPID_PRIVATE_KEY}, length: ${VAPID_PRIVATE_KEY.length}`);
  console.warn('  Run: npx web-push generate-vapid-keys');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  url?: string;
}

export async function sendPushNotification(
  userId: number,
  payload: PushNotificationPayload,
  notificationType: 'messages' | 'events' | 'rsvp' | 'tickets'
): Promise<void> {
  if (!pushNotificationsEnabled) {
    console.log(`[PUSH] Push notifications not enabled, skipping notification for user ${userId}`);
    return;
  }
  
  try {
    console.log(`[PUSH] Attempting to send ${notificationType} notification to user ${userId}`);
    console.log(`[PUSH] Payload:`, JSON.stringify(payload));
    
    // Check if user has push notifications enabled for this type
    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    // If no preferences exist, create default preferences with push enabled
    if (!prefs) {
      console.log(`[PUSH] No notification preferences found for user ${userId}, creating defaults with push enabled`);
      const [newPrefs] = await db.insert(notificationPreferences).values({
        userId,
        inAppMessages: true,
        inAppEvents: true,
        inAppRsvp: true,
        inAppTickets: true,
        pushMessages: true,
        pushEvents: true,
        pushRsvp: true,
        pushTickets: true,
      }).returning();
      prefs = newPrefs;
    }

    console.log(`[PUSH] User ${userId} notification preferences:`, prefs);

    // Map notification type to preference field
    const prefKey = `push${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)}` as keyof typeof prefs;
    
    if (!prefs[prefKey]) {
      console.log(`[PUSH] User ${userId} has disabled push notifications for ${notificationType}`);
      return;
    }

    // Get all push subscriptions for this user
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    console.log(`[PUSH] Found ${subscriptions.length} subscriptions for user ${userId}`);

    if (subscriptions.length === 0) {
      console.log(`[PUSH] No push subscriptions found for user ${userId}`);
      return;
    }

    // Send notification to all devices
    const promises = subscriptions.map(async (sub) => {
      try {
        console.log(`[PUSH] Sending to subscription ${sub.id}, endpoint: ${sub.endpoint.substring(0, 50)}...`);
        
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        // iOS requires TTL and urgency for APNs
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
          {
            TTL: 3600, // 1 hour
            urgency: 'high',
          }
        );

        console.log(`[PUSH] ✓ Push notification sent successfully to user ${userId}, subscription ${sub.id}`);
      } catch (error: any) {
        console.error(`[PUSH] ✗ Error sending push notification to subscription ${sub.id}:`, error);
        console.error(`[PUSH] Error details:`, {
          statusCode: error.statusCode,
          message: error.message,
          body: error.body
        });
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          console.log(`[PUSH] Removing invalid subscription ${sub.id}`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`[PUSH] Error in sendPushNotification for user ${userId}:`, error);
  }
}

export async function sendMessageNotification(
  userId: number,
  senderName: string,
  messagePreview: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: `New message from ${senderName}`,
    body: messagePreview,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { type: 'message', url: '/inbox' },
    url: '/inbox',
  }, 'messages');
}

export async function sendEventNotification(
  userId: number,
  eventTitle: string,
  eventCity: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'New Event Matching Your Vibe!',
    body: `${eventTitle} in ${eventCity}`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { type: 'event', url: '/discover' },
    url: '/discover',
  }, 'events');
}

export async function sendRSVPNotification(
  userId: number,
  eventTitle: string,
  status: 'sent' | 'approved' | 'declined'
): Promise<void> {
  const titles = {
    sent: 'New RSVP Request',
    approved: 'RSVP Approved!',
    declined: 'RSVP Declined',
  };

  const bodies = {
    sent: `Someone requested to join ${eventTitle}`,
    approved: `You're approved for ${eventTitle}!`,
    declined: `Your RSVP for ${eventTitle} was declined`,
  };

  // For hosts receiving new RSVP requests, link to Check-In Attendees page
  // For attendees receiving status updates, link to My Tickets
  const url = status === 'sent' ? '/check-in' : '/my-tickets';

  await sendPushNotification(userId, {
    title: titles[status],
    body: bodies[status],
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { type: 'rsvp', url },
    url,
  }, 'rsvp');
}

export async function sendTicketConfirmation(
  userId: number,
  eventTitle: string,
  quantity: number
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Ticket Purchase Confirmed',
    body: `You've purchased ${quantity} ticket${quantity > 1 ? 's' : ''} for ${eventTitle}`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { type: 'ticket', url: '/inbox' },
    url: '/inbox',
  }, 'tickets');
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
