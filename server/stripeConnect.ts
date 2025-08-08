/**
 * Stripe Connect Integration for Event Host Payouts
 * 
 * This module implements a complete Stripe Connect system that allows event hosts
 * to connect their bank accounts and receive direct payouts from ticket sales,
 * while automatically collecting a 3% application fee on all transactions.
 * 
 * Features:
 * - Express Connect account creation and onboarding
 * - Account status monitoring via webhooks
 * - Destination charges with application fees
 * - Direct payouts to connected accounts
 * - Comprehensive error handling and validation
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { stripe } from './lib/stripe';

export interface ConnectAccountStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

/**
 * Creates a new Stripe Express Connect account for the authenticated user
 */
export async function createConnectAccount(req: Request, res: Response) {
  console.log('STRIPE CONNECT: createConnectAccount called');
  try {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user exists and doesn't already have an account
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.stripeAccountId) {
      return res.status(400).json({ error: 'User already has a Stripe Connect account' });
    }

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Can be made dynamic based on user location
      email: user.email,
    });

    // Save account ID to user record
    await db
      .update(users)
      .set({ stripeAccountId: account.id })
      .where(eq(users.id, userId));

    res.json({ account });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    
    // Handle specific Stripe errors with better messages
    if (error instanceof Error) {
      const stripeError = error as any;
      
      if (stripeError.type === 'StripeInvalidRequestError') {
        if (stripeError.raw?.message?.includes('managing losses')) {
          return res.status(400).json({ 
            error: 'Platform configuration incomplete. Please contact support to complete Stripe platform setup.',
            details: 'The Stripe Connect platform profile needs to be configured before creating Express accounts.'
          });
        }
      }
    }
    
    res.status(500).json({ error: 'Failed to create Stripe Connect account' });
  }
}

/**
 * Creates an account link for onboarding flow
 */
export async function createAccountLink(req: Request, res: Response) {
  console.log('STRIPE CONNECT: createAccountLink called');
  try {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({ error: 'User does not have a Stripe Connect account' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${req.headers.origin}/stripe/connect/reauth`,
      return_url: `${req.headers.origin}/stripe/connect/success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating account link:', error);
    res.status(500).json({ error: 'Failed to create account link' });
  }
}

/**
 * Gets the current Connect account status for the authenticated user
 */
export async function getAccountStatus(req: Request, res: Response) {
  console.log('STRIPE CONNECT: getAccountStatus called');
  try {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    // Add enhanced logging for database value
    console.log(`STRIPE_STATUS_CHECK: Checking status for user ${userId}. DB value for stripeOnboardingComplete is ${user?.stripeOnboardingComplete}.`);

    if (!user || !user.stripeAccountId) {
      return res.json({
        hasAccount: false,
        onboardingComplete: false,
      } as ConnectAccountStatus);
    }

    // Use database as single source of truth - no live Stripe API call
    const status: ConnectAccountStatus = {
      hasAccount: true,
      onboardingComplete: !!user.stripeOnboardingComplete,
    };

    res.json(status);
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({ error: 'Failed to get account status' });
  }
}

/**
 * Handles Stripe Connect webhooks for account status updates
 */
export async function handleConnectWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_CONNECT_WEBHOOK_SECRET');
    return res.status(400).send('Missing webhook secret configuration');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Connect Webhook Error:', (err as Error).message);
    return res.status(400).send(`Connect Webhook Error: ${(err as Error).message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as any;
        console.log(`STRIPE_WEBHOOK: Received account.updated event for account ${account.id}.`);

        // Find user with this Stripe account ID
        const user = await db.query.users.findFirst({
          where: eq(users.stripeAccountId, account.id)
        });

        if (user) {
          const completionStatus = account.charges_enabled && account.payouts_enabled;
          
          // Update onboarding and payout status
          await db
            .update(users)
            .set({
              stripeOnboardingComplete: completionStatus,
            })
            .where(eq(users.id, user.id));

          console.log(`STRIPE_WEBHOOK: Successfully updated database for user ${user.id}. Set stripeOnboardingComplete to ${completionStatus}.`);
          console.log(`Updated Connect status for user ${user.id}:`, {
            onboarding: completionStatus,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
          });
        } else {
          console.log(`STRIPE_WEBHOOK: No user found with stripeAccountId ${account.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Connect event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Connect webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * Calculates application fee for a given amount (3% platform fee)
 */
export function calculateApplicationFee(amountInCents: number): number {
  return Math.round(amountInCents * 0.03);
}

/**
 * Manual verification endpoint to sync account status with Stripe
 */
export async function verifyAccount(req: Request, res: Response) {
  console.log('STRIPE CONNECT: verifyAccount called');
  try {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({ error: 'User does not have a Stripe Connect account' });
    }

    // Make live API call to get current status from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    
    // Use exact same logic as webhook
    const correctStatus = account.charges_enabled && account.payouts_enabled;
    
    console.log(`STRIPE_VERIFY: Manual verification for user ${userId}. Stripe says: charges_enabled=${account.charges_enabled}, payouts_enabled=${account.payouts_enabled}, setting to: ${correctStatus}`);
    
    // Update user record with correct status
    await db
      .update(users)
      .set({
        stripeOnboardingComplete: correctStatus,
      })
      .where(eq(users.id, userId));

    console.log(`STRIPE_VERIFY: Successfully updated database for user ${userId}. Set stripeOnboardingComplete to ${correctStatus}.`);

    // Return updated status
    const status: ConnectAccountStatus = {
      hasAccount: true,
      onboardingComplete: correctStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };

    res.json(status);
  } catch (error) {
    console.error('Error verifying account:', error);
    res.status(500).json({ error: 'Failed to verify account' });
  }
}

/**
 * Validates that an event creator can receive payments
 */
export async function validateEventCreatorForPayment(creatorId: number) {
  const creator = await db.query.users.findFirst({
    where: eq(users.id, creatorId),
    columns: {
      id: true,
      stripeAccountId: true,
      stripeOnboardingComplete: true,
    }
  });

  if (!creator) {
    throw new Error('Event creator not found');
  }

  if (!creator.stripeAccountId || !creator.stripeOnboardingComplete) {
    throw new Error('Event creator has not completed payment setup. Ticket purchases are currently unavailable.');
  }

  return creator;
}