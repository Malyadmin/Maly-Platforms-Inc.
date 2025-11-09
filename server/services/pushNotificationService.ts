import webpush from 'web-push';
import { db } from '../../db';
import { pushSubscriptions, notificationPreferences } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

// Generate VAPID keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@maly.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✓ Push notifications configured with VAPID keys');
} else {
  console.warn('⚠ VAPID keys not configured. Push notifications will not work.');
  console.warn('  Run: npx web-push generate-vapid-keys');
  console.warn('  Then add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to your .env file');
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
  try {
    // Check if user has push notifications enabled for this type
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    if (!prefs) {
      console.log(`No notification preferences found for user ${userId}`);
      return;
    }

    // Map notification type to preference field
    const prefKey = `push${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)}` as keyof typeof prefs;
    
    if (!prefs[prefKey]) {
      console.log(`User ${userId} has disabled push notifications for ${notificationType}`);
      return;
    }

    // Get all push subscriptions for this user
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    // Send notification to all devices
    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );

        console.log(`✓ Push notification sent to user ${userId}`);
      } catch (error: any) {
        console.error(`Error sending push notification to subscription ${sub.id}:`, error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          console.log(`Removing invalid subscription ${sub.id}`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`Error in sendPushNotification for user ${userId}:`, error);
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
    sent: 'RSVP Sent',
    approved: 'RSVP Approved!',
    declined: 'RSVP Declined',
  };

  const bodies = {
    sent: `Your RSVP for ${eventTitle} has been sent`,
    approved: `You're approved for ${eventTitle}!`,
    declined: `Your RSVP for ${eventTitle} was declined`,
  };

  await sendPushNotification(userId, {
    title: titles[status],
    body: bodies[status],
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { type: 'rsvp', url: '/inbox' },
    url: '/inbox',
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
