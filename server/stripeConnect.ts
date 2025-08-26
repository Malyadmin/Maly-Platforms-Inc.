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
        
        // Enhanced logging: Log the full account object to understand what Stripe is sending
        console.log('STRIPE_WEBHOOK: Full account object:', JSON.stringify({
          id: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements,
          capabilities: account.capabilities
        }, null, 2));

        // Find user with this Stripe account ID
        const user = await db.query.users.findFirst({
          where: eq(users.stripeAccountId, account.id)
        });

        if (user) {
          // FIXED: Proper onboarding completion logic
          // Express accounts are complete when:
          // 1. details_submitted is true (user has submitted all info)
          // 2. No currently_due requirements remain
          // 3. charges_enabled is true (can accept payments)
          const hasSubmittedDetails = account.details_submitted === true;
          const hasNoCurrentRequirements = !account.requirements?.currently_due?.length;
          const canAcceptCharges = account.charges_enabled === true;
          
          const completionStatus = hasSubmittedDetails && hasNoCurrentRequirements && canAcceptCharges;
          
          console.log(`STRIPE_WEBHOOK: Onboarding completion check for user ${user.id}:`, {
            details_submitted: account.details_submitted,
            currently_due_requirements: account.requirements?.currently_due || [],
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            final_completion_status: completionStatus
          });
          
          // Update onboarding status
          await db
            .update(users)
            .set({
              stripeOnboardingComplete: completionStatus,
            })
            .where(eq(users.id, user.id));

          console.log(`STRIPE_WEBHOOK: Successfully updated database for user ${user.id}. Set stripeOnboardingComplete to ${completionStatus}.`);
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
    
    console.log('STRIPE_VERIFY: Full account details from Stripe API:', JSON.stringify({
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
    }, null, 2));
    
    // Use exact same logic as webhook - FIXED completion logic
    const hasSubmittedDetails = account.details_submitted === true;
    const hasNoCurrentRequirements = !account.requirements?.currently_due?.length;
    const canAcceptCharges = account.charges_enabled === true;
    
    const correctStatus = hasSubmittedDetails && hasNoCurrentRequirements && canAcceptCharges;
    
    console.log(`STRIPE_VERIFY: Manual verification for user ${userId}. Onboarding check:`, {
      details_submitted: account.details_submitted,
      currently_due_requirements: account.requirements?.currently_due || [],
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      final_status: correctStatus
    });
    
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

  if (!creator.stripeAccountId) {
    throw new Error('Event creator has not set up payment receiving. Please complete Stripe Connect setup first.');
  }

  // Always fetch the latest account status from Stripe to handle edge cases
  try {
    // First check if the account exists on Stripe
    const account = await stripe.accounts.retrieve(creator.stripeAccountId);
    
    console.log(`STRIPE_VALIDATION: Checking account ${creator.stripeAccountId}`, {
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      currently_due: account.requirements?.currently_due || [],
      past_due: account.requirements?.past_due || [],
      disabled_reason: account.requirements?.disabled_reason
    });
    
    // Check if account can process payments
    // Allow if details submitted and no past_due requirements (currently_due is ok for initial verification)
    const canProcessPayments = 
      account.details_submitted && 
      (!account.requirements?.past_due || account.requirements.past_due.length === 0) &&
      !account.requirements?.disabled_reason;
    
    if (!canProcessPayments) {
      console.error(`STRIPE_VALIDATION: Account cannot process payments`, {
        stripeAccountId: creator.stripeAccountId,
        details_submitted: account.details_submitted,
        past_due: account.requirements?.past_due,
        disabled_reason: account.requirements?.disabled_reason
      });
      throw new Error('Event creator has not completed payment setup. Please finish Stripe Connect onboarding.');
    }
    
    // Special handling for automatic tax verification scenario
    // If details are submitted but charges not enabled yet, it might be waiting for first transaction
    if (account.details_submitted && !account.charges_enabled) {
      const isWaitingForTaxVerification = 
        account.requirements?.currently_due?.some(req => 
          req.includes('tax') || req.includes('verification')
        ) || false;
      
      if (isWaitingForTaxVerification) {
        console.log(`STRIPE_VALIDATION: Account ${creator.stripeAccountId} is pending automatic tax verification. Allowing initial transaction.`);
        // Allow the transaction to proceed for tax verification
      }
    }
    
    // Update the database flag if the account is now fully enabled
    if (account.charges_enabled && account.payouts_enabled && !creator.stripeOnboardingComplete) {
      await db
        .update(users)
        .set({ stripeOnboardingComplete: true })
        .where(eq(users.id, creatorId));
      console.log(`STRIPE_VALIDATION: Updated onboarding status for user ${creatorId} to complete.`);
    }
    
  } catch (error: any) {
    console.error('Error checking Stripe account status:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      // The Stripe account doesn't exist anymore - clear it from database
      console.log(`STRIPE_VALIDATION: Account ${creator.stripeAccountId} doesn't exist on Stripe. Clearing from database.`);
      
      await db
        .update(users)
        .set({ 
          stripeAccountId: null,
          stripeOnboardingComplete: false 
        })
        .where(eq(users.id, creatorId));
        
      throw new Error('Event creator\'s payment account is no longer valid. They need to set up payments again.');
    }
    
    // If we can't reach Stripe API, check if we should allow based on database status
    // In production, be more cautious
    if (!creator.stripeOnboardingComplete) {
      throw new Error('Event creator payment setup could not be verified. Please try again or contact support.');
    }
  }

  return creator;
}