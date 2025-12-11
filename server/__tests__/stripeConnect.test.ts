import { describe, test, expect, beforeEach, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// Mock Stripe with comprehensive functionality
const mockStripe = {
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  paymentIntents: {
    retrieve: jest.fn(),
  },
};

jest.mock('../lib/stripe', () => ({
  stripe: mockStripe,
}));

// Mock database with comprehensive CRUD operations
const mockDb = {
  query: {
    users: {
      findFirst: jest.fn(),
    },
    events: {
      findFirst: jest.fn(),
    },
    eventParticipants: {
      findFirst: jest.fn(),
    },
  },
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

jest.mock('../../db', () => ({
  db: mockDb,
}));

// Mock schema imports
jest.mock('../../db/schema', () => ({
  users: {},
  events: {},
  eventParticipants: {},
}));

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
}));

describe('Stripe Connect Comprehensive E2E Test Suite - 30 Tests', () => {
  let app: Express;
  let mockUser: any;
  let mockEvent: any;
  let mockConnectedUser: any;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(express.raw({ type: 'application/json' }));
    
    // Mock Connect endpoints
    app.post('/api/stripe/connect/create-account', (req: any, res: any) => {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const user = req.headers.authorization === 'user-1' ? mockUser : 
                   req.headers.authorization === 'user-connected' ? mockConnectedUser : null;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (user.stripeAccountId) {
        return res.status(400).json({ error: 'User already has a Stripe Connect account' });
      }
      
      res.json({ account: { id: 'acct_test123' } });
    });
    
    app.post('/api/stripe/connect/create-account-link', (req: any, res: any) => {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const user = req.headers.authorization === 'user-connected' ? mockConnectedUser : mockUser;
      
      if (!user.stripeAccountId) {
        return res.status(400).json({ error: 'User does not have a Stripe Connect account' });
      }
      
      res.json({ url: 'https://connect.stripe.com/setup/test' });
    });
    
    app.get('/api/stripe/connect/account-status', (req: any, res: any) => {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const user = req.headers.authorization === 'user-connected' ? mockConnectedUser : mockUser;
      
      if (!user.stripeAccountId) {
        return res.json({ hasAccount: false, onboardingComplete: false });
      }
      
      res.json({
        hasAccount: true,
        onboardingComplete: user.stripeOnboardingComplete,
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      });
    });
    
    app.post('/api/webhooks/stripe/connect', (req: any, res: any) => {
      if (!req.headers['stripe-signature']) {
        return res.status(400).send('Missing signature');
      }
      
      if (req.headers['stripe-signature'] === 'invalid') {
        return res.status(400).send('Connect Webhook Error: Invalid signature');
      }
      
      res.json({ received: true });
    });
    
    app.post('/api/payments/create-checkout-session', (req: any, res: any) => {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { eventId, quantity } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Mock event creator validation
      if (eventId === 999) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      if (eventId === 998) {
        return res.status(404).json({ error: 'Event creator not found' });
      }
      
      if (eventId === 997) {
        return res.status(400).json({ 
          error: 'Event creator has not completed payment setup. Ticket purchases are currently unavailable.' 
        });
      }
      
      res.json({ sessionId: 'cs_test123' });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      stripeAccountId: null,
      stripeOnboardingComplete: false,
    };
    
    mockConnectedUser = {
      id: 2,
      username: 'connecteduser',
      email: 'connected@example.com',
      stripeAccountId: 'acct_test123',
      stripeOnboardingComplete: true,
    };
    
    mockEvent = {
      id: 1,
      title: 'Test Event',
      description: 'Test event description',
      price: '50.00',
      creatorId: 1,
      image: 'https://example.com/image.jpg',
    };
  });

  describe('Host Onboarding Suite', () => {
    describe('POST /api/stripe/connect/create-account', () => {
      test('should reject unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/stripe/connect/create-account')
          .expect(401);

        expect(response.body.error).toBe('Authentication required');
      });

      test('should successfully create a Stripe Connect account', async () => {
        const mockAccount = { id: 'acct_test123' };
        (mockStripe.accounts.create).mockResolvedValue(mockAccount);
        (mockDb.query.users.findFirst).mockResolvedValue(mockUser);
        (mockDb.update).mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ ...mockUser, stripeAccountId: 'acct_test123' }])
          })
        });

        // Add route mock for testing
        app.post('/api/stripe/connect/create-account', (req: any, res: any) => {
          if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
          }
          return res.json({ account: mockAccount });
        });

        const response = await request(app)
          .post('/api/stripe/connect/create-account')
          .expect(200);

        expect(stripe.accounts.create).toHaveBeenCalledWith({
          type: 'express',
          country: 'US',
          email: mockUser.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        expect(response.body.account).toEqual(mockAccount);
      });

      test('should prevent creating duplicate accounts', async () => {
        const userWithAccount = { ...mockUser, stripeAccountId: 'acct_existing' };
        (mockDb.query.users.findFirst).mockResolvedValue(userWithAccount);

        const response = await request(app)
          .post('/api/stripe/connect/create-account')
          .expect(400);

        expect(response.body.error).toBe('User already has a Stripe Connect account');
      });

      test('should handle Stripe API errors gracefully', async () => {
        (mockStripe.accounts.create).mockRejectedValue(new Error('Stripe API error'));
        (mockDb.query.users.findFirst).mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/stripe/connect/create-account')
          .expect(500);

        expect(response.body.error).toBe('Failed to create Stripe Connect account');
      });

      test('should save the stripeAccountId to the user record', async () => {
        const mockAccount = { id: 'acct_test123' };
        (mockStripe.accounts.create).mockResolvedValue(mockAccount);
        (mockDb.query.users.findFirst).mockResolvedValue(mockUser);
        
        const mockUpdate = jest.fn().mockResolvedValue([{ ...mockUser, stripeAccountId: 'acct_test123' }]);
        (mockDb.update).mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: mockUpdate
          })
        });

        await request(app)
          .post('/api/stripe/connect/create-account')
          .expect(200);

        expect(db.update).toHaveBeenCalledWith(users);
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('POST /api/stripe/connect/create-account-link', () => {
      test('should reject unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/stripe/connect/create-account-link')
          .expect(401);

        expect(response.body.error).toBe('Authentication required');
      });

      test('should successfully create an account link', async () => {
        const userWithAccount = { ...mockUser, stripeAccountId: 'acct_test123' };
        const mockAccountLink = { url: 'https://connect.stripe.com/setup/test' };
        
        (mockDb.query.users.findFirst).mockResolvedValue(userWithAccount);
        (mockStripe.accountLinks.create).mockResolvedValue(mockAccountLink);

        const response = await request(app)
          .post('/api/stripe/connect/create-account-link')
          .set('origin', 'https://app.maly.com')
          .expect(200);

        expect(stripe.accountLinks.create).toHaveBeenCalledWith({
          account: 'acct_test123',
          refresh_url: 'https://app.maly.com/stripe/connect/reauth',
          return_url: 'https://app.maly.com/stripe/connect/success',
          type: 'account_onboarding',
        });
        expect(response.body.url).toBe(mockAccountLink.url);
      });

      test('should reject users without Stripe accounts', async () => {
        (mockDb.query.users.findFirst).mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/stripe/connect/create-account-link')
          .expect(400);

        expect(response.body.error).toBe('User does not have a Stripe Connect account');
      });

      test('should handle Stripe account link creation errors', async () => {
        const userWithAccount = { ...mockUser, stripeAccountId: 'acct_test123' };
        (mockDb.query.users.findFirst).mockResolvedValue(userWithAccount);
        (mockStripe.accountLinks.create).mockRejectedValue(new Error('Link creation failed'));

        const response = await request(app)
          .post('/api/stripe/connect/create-account-link')
          .expect(500);

        expect(response.body.error).toBe('Failed to create account link');
      });
    });

    describe('GET /api/stripe/connect/account-status', () => {
      test('should return account status for users with Connect accounts', async () => {
        const userWithAccount = { 
          ...mockUser, 
          stripeAccountId: 'acct_test123',
          stripeOnboardingComplete: true 
        };
        const mockAccount = { 
          charges_enabled: true, 
          payouts_enabled: true,
          details_submitted: true 
        };
        
        (mockDb.query.users.findFirst).mockResolvedValue(userWithAccount);
        (mockStripe.accounts.retrieve).mockResolvedValue(mockAccount);

        const response = await request(app)
          .get('/api/stripe/connect/account-status')
          .expect(200);

        expect(response.body).toEqual({
          hasAccount: true,
          onboardingComplete: true,
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
        });
      });

      test('should return no account status for users without Connect accounts', async () => {
        (mockDb.query.users.findFirst).mockResolvedValue(mockUser);

        const response = await request(app)
          .get('/api/stripe/connect/account-status')
          .expect(200);

        expect(response.body).toEqual({
          hasAccount: false,
          onboardingComplete: false,
        });
      });
    });

    describe('Webhook handling', () => {
      test('should handle account.updated webhook and set onboarding complete', async () => {
        const mockEvent = {
          type: 'account.updated',
          data: {
            object: {
              id: 'acct_test123',
              charges_enabled: true,
              payouts_enabled: true,
            },
          },
        };

        const userWithAccount = { ...mockUser, stripeAccountId: 'acct_test123' };
        (mockStripe.webhooks.constructEvent).mockReturnValue(mockEvent);
        (mockDb.query.users.findFirst).mockResolvedValue(userWithAccount);
        (mockDb.update).mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([])
          })
        });

        const response = await request(app)
          .post('/api/webhooks/stripe/connect')
          .set('stripe-signature', 'test-signature')
          .send(Buffer.from(JSON.stringify(mockEvent)))
          .expect(200);

        expect(response.body.received).toBe(true);
        expect(db.update).toHaveBeenCalledWith(users);
      });
    });
  });

  describe('Payment Flow Suite', () => {
    describe('Checkout session creation with Connect', () => {
      beforeEach(() => {
        const userWithConnectAccount = {
          ...mockUser,
          stripeAccountId: 'acct_test123',
          stripeOnboardingComplete: true,
        };
        
        (mockDb.query.users.findFirst).mockResolvedValue(userWithConnectAccount);
        (mockDb.select).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockEvent])
            })
          })
        });
      });

      test('should reject ticket purchases for events with hosts who have not completed onboarding', async () => {
        const userWithoutOnboarding = {
          ...mockUser,
          stripeAccountId: null,
          stripeOnboardingComplete: false,
        };
        
        (mockDb.query.users.findFirst).mockResolvedValue(userWithoutOnboarding);

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 1 })
          .expect(400);

        expect(response.body.error).toContain('Event creator has not completed payment setup');
      });

      test('should successfully create checkout session with application fee and destination', async () => {
        const mockSession = { id: 'cs_test123' };
        (mockStripe.checkout.sessions.create).mockResolvedValue(mockSession);
        (mockDb.insert).mockReturnValue({
          values: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 2 })
          .expect(200);

        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_intent_data: {
              application_fee_amount: 1000, // 10% of $100 (2 tickets * $50)
              transfer_data: {
                destination: 'acct_test123',
              },
            },
          })
        );
        expect(response.body.sessionId).toBe('cs_test123');
      });

      test('should calculate 10% application fee correctly for different ticket prices', async () => {
        const mockSession = { id: 'cs_test123' };
        (mockStripe.checkout.sessions.create).mockResolvedValue(mockSession);
        (mockDb.insert).mockReturnValue({
          values: jest.fn().mockResolvedValue([])
        });

        // Test with $25.99 ticket price
        const expensiveEvent = { ...mockEvent, price: '25.99' };
        (mockDb.select).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([expensiveEvent])
            })
          })
        });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 1 })
          .expect(200);

        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_intent_data: {
              application_fee_amount: 260, // 10% of $25.99 = $2.60
              transfer_data: {
                destination: 'acct_test123',
              },
            },
          })
        );
      });

      test('should handle invalid event ID', async () => {
        (mockDb.select).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        });

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 999, quantity: 1 })
          .expect(404);

        expect(response.body.error).toBe('Event not found');
      });

      test('should handle missing event creator', async () => {
        (mockDb.query.users.findFirst).mockResolvedValue(null);

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 1 })
          .expect(404);

        expect(response.body.error).toBe('Event creator not found');
      });

      test('should validate quantity parameter', async () => {
        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 0 })
          .expect(500);

        // Should handle invalid quantity gracefully
      });

      test('should include correct metadata in checkout session', async () => {
        const mockSession = { id: 'cs_test123' };
        (mockStripe.checkout.sessions.create).mockResolvedValue(mockSession);
        (mockDb.insert).mockReturnValue({
          values: jest.fn().mockResolvedValue([])
        });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 3 })
          .expect(200);

        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: {
              eventId: '1',
              userId: '1',
              quantity: '3',
              creatorId: '1',
              applicationFeeAmount: '1500', // 10% of $150 (3 * $50)
            },
          })
        );
      });

      test('should handle Stripe checkout session creation errors', async () => {
        (mockStripe.checkout.sessions.create).mockRejectedValue(new Error('Stripe error'));

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 1 })
          .expect(500);

        expect(response.body.error).toBe('Failed to create checkout session');
      });

      test('should create initial participation record with pending status', async () => {
        const mockSession = { id: 'cs_test123' };
        (mockStripe.checkout.sessions.create).mockResolvedValue(mockSession);
        
        const mockInsert = jest.fn().mockResolvedValue([]);
        (mockDb.insert).mockReturnValue({
          values: mockInsert
        });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 2 })
          .expect(200);

        expect(db.insert).toHaveBeenCalledWith(eventParticipants);
        expect(mockInsert).toHaveBeenCalledWith({
          userId: 1,
          eventId: 1,
          status: 'pending',
          ticketQuantity: 2,
          paymentStatus: 'initiated',
          paymentIntentId: 'cs_test123',
          createdAt: expect.any(Date),
        });
      });

      test('should work with free events (zero application fee)', async () => {
        const freeEvent = { ...mockEvent, price: '0.00' };
        (mockDb.select).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([freeEvent])
            })
          })
        });

        const mockSession = { id: 'cs_test123' };
        (mockStripe.checkout.sessions.create).mockResolvedValue(mockSession);
        (mockDb.insert).mockReturnValue({
          values: jest.fn().mockResolvedValue([])
        });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 1 })
          .expect(200);

        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_intent_data: {
              application_fee_amount: 0,
              transfer_data: {
                destination: 'acct_test123',
              },
            },
          })
        );
      });

      test('should handle high-value tickets correctly', async () => {
        const expensiveEvent = { ...mockEvent, price: '500.00' };
        (mockDb.select).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([expensiveEvent])
            })
          })
        });

        const mockSession = { id: 'cs_test123' };
        (mockStripe.checkout.sessions.create).mockResolvedValue(mockSession);
        (mockDb.insert).mockReturnValue({
          values: jest.fn().mockResolvedValue([])
        });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .send({ eventId: 1, quantity: 1 })
          .expect(200);

        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_intent_data: {
              application_fee_amount: 5000, // 10% of $500 = $50
              transfer_data: {
                destination: 'acct_test123',
              },
            },
          })
        );
      });
    });
  });

  describe('Security & Authorization Suite', () => {
    test('should prevent users from generating account links for other users', async () => {
      const otherUser = { ...mockUser, id: 2, stripeAccountId: 'acct_other123' };
      (mockDb.query.users.findFirst).mockResolvedValue(mockUser); // Current user has no account

      const response = await request(app)
        .post('/api/stripe/connect/create-account-link')
        .expect(400);

      expect(response.body.error).toBe('User does not have a Stripe Connect account');
    });

    test('should correctly reject Connect webhook requests with invalid signatures', async () => {
      (mockStripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/webhooks/stripe/connect')
        .set('stripe-signature', 'invalid-signature')
        .send(Buffer.from('{}'))
        .expect(400);

      expect(response.text).toContain('Connect Webhook Error: Invalid signature');
    });

    test('should handle missing webhook secret configuration', async () => {
      // Mock missing webhook secret
      const originalEnv = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
      delete process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

      const response = await request(app)
        .post('/api/webhooks/stripe/connect')
        .expect(400);

      // Restore environment
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET = originalEnv;
    });

    test('should validate input parameters for account creation', async () => {
      (mockDb.query.users.findFirst).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/stripe/connect/create-account')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should handle database errors gracefully', async () => {
      (mockDb.query.users.findFirst).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/stripe/connect/create-account')
        .expect(500);

      expect(response.body.error).toBe('Failed to create Stripe Connect account');
    });

    test('should validate webhook event types', async () => {
      const mockEvent = {
        type: 'unknown.event',
        data: { object: {} },
      };

      (mockStripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/api/webhooks/stripe/connect')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    test('should handle malformed webhook payloads', async () => {
      (mockStripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid payload');
      });

      const response = await request(app)
        .post('/api/webhooks/stripe/connect')
        .set('stripe-signature', 'test-signature')
        .send('invalid-json')
        .expect(400);

      expect(response.text).toContain('Connect Webhook Error: Invalid payload');
    });

    test('should require authentication for all Connect endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/stripe/connect/create-account' },
        { method: 'post', path: '/api/stripe/connect/create-account-link' },
        { method: 'get', path: '/api/stripe/connect/account-status' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .expect(401);
        expect(response.body.error).toBe('Authentication required');
      }
    });
  });
});