import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { users, sessions, payments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from './middleware/auth.middleware';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

// Get premium status for the current user
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPremium = user.isPremium || false;
    
    // Get payment history if premium
    let subscription = null;
    if (isPremium) {
      const paymentRecord = await db.query.payments.findFirst({
        where: eq(payments.userId, userId),
        orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      });
      
      if (paymentRecord?.stripeSubscriptionId) {
        try {
          subscription = await stripe.subscriptions.retrieve(paymentRecord.stripeSubscriptionId);
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }
      }
    }

    return res.json({
      isPremium,
      subscription: subscription ? {
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end * 1000, // Convert to milliseconds
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null
    });
  } catch (error) {
    console.error('Error fetching premium status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a checkout session for premium subscription
router.post('/create-checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isPremium) {
      return res.status(400).json({ message: 'User already has premium subscription' });
    }

    // Get subscription type from request body
    const { subscriptionType } = req.body;
    if (!subscriptionType) {
      return res.status(400).json({ message: 'Subscription type is required' });
    }

    console.log(`Creating checkout session for ${subscriptionType} subscription`);

    // Determine price based on subscription type
    let amount: number;
    let interval: 'month' | 'year';
    let productName: string;

    if (subscriptionType === 'monthly') {
      amount = 2900; // $29.00
      interval = 'month';
      productName = 'Maly Premium Monthly';
    } else if (subscriptionType === 'yearly') {
      amount = 29000; // $290.00
      interval = 'year';
      productName = 'Maly Premium Yearly';
    } else {
      return res.status(400).json({ message: 'Invalid subscription type' });
    }

    // Create checkout session with direct price data
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: 'Premium subscription to Maly platform',
            },
            unit_amount: amount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || process.env.APP_URL}/premium-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || process.env.APP_URL}/premium?canceled=true`,
      client_reference_id: userId.toString(),
      customer_email: user.email,
      metadata: {
        userId: userId.toString()
      }
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify checkout session and update user's premium status
router.get('/verify-checkout', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;
    
    console.log(`Premium verification request for session: ${session_id}`);
    
    if (!session_id || typeof session_id !== 'string') {
      console.error('Missing or invalid session_id in verify-checkout request');
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Try to get user ID from request if available
    let currentUserId;
    if (req.isAuthenticated() && req.user) {
      currentUserId = (req.user as any).id;
      console.log(`User authenticated via Passport: ${currentUserId}`);
    } else {
      // Try alternative authentication methods
      const headerSessionId = req.headers['x-session-id'] as string;
      const cookieSessionId = req.cookies?.maly_session_id || req.cookies?.sessionId;
      
      console.log('Premium verify-checkout authentication attempt:', {
        headerSessionId: headerSessionId || 'not_present',
        cookieSessionId: cookieSessionId || 'not_present',
      });
      
      // If we have a session ID, try to get the user
      if (headerSessionId || cookieSessionId) {
        const sessionId = headerSessionId || cookieSessionId;
        try {
          const sessionQuery = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId));
            
          if (sessionQuery.length > 0 && sessionQuery[0].userId) {
            currentUserId = sessionQuery[0].userId;
            console.log(`User authenticated via session ID: ${currentUserId}`);
          }
        } catch (error) {
          console.error("Error checking session:", error);
        }
      }
    }

    // Retrieve the checkout session from Stripe
    console.log(`Retrieving Stripe checkout session: ${session_id}`);
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!checkoutSession) {
      console.error(`Stripe session not found: ${session_id}`);
      return res.status(404).json({ message: 'Checkout session not found' });
    }
    
    console.log(`Stripe checkout session retrieved:`, {
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      customer: checkoutSession.customer,
      subscription: checkoutSession.subscription,
      metadata: checkoutSession.metadata,
      client_reference_id: checkoutSession.client_reference_id
    });

    // Check payment status
    if (checkoutSession.payment_status !== 'paid') {
      console.error(`Payment not completed for session ${session_id}. Status: ${checkoutSession.payment_status}`);
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Get userId from session metadata or client_reference_id
    const metadataUserId = checkoutSession.metadata?.userId ? parseInt(checkoutSession.metadata.userId) : null;
    const clientRefUserId = checkoutSession.client_reference_id ? parseInt(checkoutSession.client_reference_id) : null;
    const userId = metadataUserId || clientRefUserId;
    
    console.log(`User ID from session: ${userId}`);
    
    if (!userId) {
      console.error(`User ID not found in checkout session: ${session_id}`);
      return res.status(400).json({ message: 'User ID not found in checkout session' });
    }

    // Validate user ID matches authenticated user if available
    if (currentUserId && currentUserId !== userId) {
      console.error(`User ID mismatch: authenticated as ${currentUserId}, session for ${userId}`);
      return res.status(403).json({ message: 'Not authorized to verify this checkout session' });
    }

    // Update user's premium status
    console.log(`Updating premium status for user ${userId}`);
    await db.update(users)
      .set({ 
        isPremium: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Get subscription details if available
    let subscriptionDetails = null;
    if (checkoutSession.subscription) {
      const subscriptionId = typeof checkoutSession.subscription === 'string' 
        ? checkoutSession.subscription 
        : checkoutSession.subscription.id;
      
      console.log(`Retrieving subscription details for ${subscriptionId}`);
      subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Save subscription in our database
      const currentPeriodStart = new Date(subscriptionDetails.current_period_start * 1000);
      const currentPeriodEnd = new Date(subscriptionDetails.current_period_end * 1000);
      
      console.log(`Storing subscription record. Start: ${currentPeriodStart}, End: ${currentPeriodEnd}`);
      
      // Check if subscription already exists
      const existingSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, subscriptionId)
      });
      
      if (existingSubscription) {
        console.log(`Updating existing subscription record ${existingSubscription.id}`);
        // Update existing record
        await db.update(subscriptions)
          .set({
            status: subscriptionDetails.status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionDetails.cancel_at_period_end,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, existingSubscription.id));
      } else {
        console.log(`Creating new subscription record`);
        // Create new record
        await db.insert(subscriptions).values({
          userId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: typeof checkoutSession.customer === 'string' ? checkoutSession.customer : checkoutSession.customer?.id,
          status: subscriptionDetails.status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionDetails.cancel_at_period_end,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Store payment information
    const customerId = typeof checkoutSession.customer === 'string' 
      ? checkoutSession.customer 
      : checkoutSession.customer?.id;
    
    const subscriptionId = checkoutSession.subscription 
      ? (typeof checkoutSession.subscription === 'string' 
        ? checkoutSession.subscription 
        : checkoutSession.subscription.id) 
      : null;
    
    console.log(`Recording payment: Amount: ${checkoutSession.amount_total}, Customer: ${customerId}, Subscription: ${subscriptionId}`);
    
    await db.insert(payments).values({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeCheckoutSessionId: session_id,
      amount: checkoutSession.amount_total || 0,
      currency: checkoutSession.currency || 'usd',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Premium subscription verification completed successfully for user ${userId}`);
    return res.json({ 
      success: true,
      userId,
      isPremium: true,
      subscription: subscriptionDetails ? {
        id: subscriptionDetails.id,
        status: subscriptionDetails.status,
        currentPeriodEnd: subscriptionDetails.current_period_end
      } : null
    });
  } catch (error) {
    console.error('Error verifying premium checkout:', error);
    return res.status(500).json({ message: 'Internal server error during verification' });
  }
});

// Cancel subscription
router.post('/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const paymentRecord = await db.query.payments.findFirst({
      where: eq(payments.userId, userId),
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    });

    if (!paymentRecord?.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Cancel at period end
    await stripe.subscriptions.update(paymentRecord.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;