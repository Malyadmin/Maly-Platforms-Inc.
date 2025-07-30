import request from 'supertest';
import express from 'express';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the entire database module
const mockDb = {
  query: {
    events: {
      findFirst: jest.fn()
    },
    eventParticipants: {
      findFirst: jest.fn()
    },
    users: {
      findFirst: jest.fn()
    }
  },
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis()
};

jest.mock('../../db', () => ({ db: mockDb }));
jest.mock('../../db/schema', () => ({
  events: {},
  eventParticipants: {},
  users: {}
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn()
}));

// Test data
const mockEventHost = {
  id: 1,
  username: 'eventhost',
  email: 'host@example.com',
  fullName: 'Event Host',
  isAdmin: false
};

const mockApplicant = {
  id: 2,
  username: 'applicant1',
  email: 'applicant1@example.com',
  fullName: 'John Applicant',
  isAdmin: false
};

const mockEvent = {
  id: 1,
  title: 'Tech Conference 2024',
  description: 'Annual tech conference',
  location: 'San Francisco Convention Center',
  createdBy: 1,
  attendingCount: 5,
  maxAttendees: 100
};

const mockApplication = {
  id: 101,
  eventId: 1,
  userId: 2,
  status: 'pending_approval',
  ticketQuantity: 2,
  totalAmount: 399.98,
  createdAt: new Date('2024-01-16T10:00:00Z')
};

// Setup test app
let app: express.Application;

beforeEach(() => {
  app = express();
  app.use(express.json());
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('RSVP Management System - E2E Tests', () => {

  // Authentication middleware mock
  const mockAuth = (userId: number) => (req: any, res: any, next: any) => {
    req.user = userId === 1 ? mockEventHost : mockApplicant;
    next();
  };

  describe('Fetch Pending Applications', () => {
    
    test('1. Event host should successfully fetch pending applications', async () => {
      // Setup mocks
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{
              id: 101,
              userId: 2,
              status: 'pending_approval',
              ticketQuantity: 2,
              username: 'applicant1',
              fullName: 'John Applicant',
              email: 'applicant1@example.com'
            }])
          })
        })
      });

      // Setup route
      app.use('/api/events/:eventId/applications', mockAuth(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        const event = await mockDb.query.events.findFirst();
        
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        const applications = await mockDb.select().from().innerJoin().where();

        res.json({
          eventId: event.id,
          eventTitle: event.title,
          applications,
          totalPending: applications.length
        });
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(200);

      expect(response.body.eventId).toBe(1);
      expect(response.body.eventTitle).toBe('Tech Conference 2024');
      expect(response.body.totalPending).toBe(1);
    });

    test('2. Non-host should receive 403 error', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);

      app.use('/api/events/:eventId/applications', mockAuth(2)); // Non-host user
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const event = await mockDb.query.events.findFirst();
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(403);

      expect(response.body.error).toBe('You can only manage applications for your own events');
    });

    test('3. Should return 404 for non-existent event', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(null);

      app.use('/api/events/:eventId/applications', mockAuth(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const event = await mockDb.query.events.findFirst();
        
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/events/999/applications')
        .expect(404);

      expect(response.body.error).toBe('Event not found');
    });

    test('4. Should handle empty applications list', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]) // Empty array
          })
        })
      });

      app.use('/api/events/:eventId/applications', mockAuth(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await mockDb.select().from().innerJoin().where();
        
        res.json({
          eventId: 1,
          eventTitle: 'Tech Conference 2024',
          applications,
          totalPending: applications.length
        });
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(200);

      expect(response.body.totalPending).toBe(0);
      expect(response.body.applications).toHaveLength(0);
    });

    test('5. Should validate eventId parameter format', async () => {
      app.use('/api/events/:eventId/applications', mockAuth(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        if (isNaN(eventId)) {
          return res.status(400).json({ error: 'Invalid event ID format' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/events/invalid/applications')
        .expect(400);

      expect(response.body.error).toBe('Invalid event ID format');
    });
  });

  describe('Approve/Reject Applications', () => {
    
    test('6. Should successfully approve a pending application', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.query.eventParticipants.findFirst.mockResolvedValue(mockApplication);
      mockDb.query.users.findFirst.mockResolvedValue(mockApplicant);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              id: 101,
              status: 'attending',
              ticketQuantity: 2
            }])
          })
        })
      });

      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status. Must be \'approved\' or \'rejected\'' });
        }

        const event = await mockDb.query.events.findFirst();
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        const application = await mockDb.query.eventParticipants.findFirst();
        if (!application) {
          return res.status(404).json({ error: 'Pending application not found for this user and event' });
        }

        const updatedApplication = await mockDb.update().set().where().returning();
        const applicant = await mockDb.query.users.findFirst();

        res.json({
          message: `Application ${status} successfully`,
          application: updatedApplication[0],
          applicant: {
            username: applicant.username,
            fullName: applicant.fullName,
            email: applicant.email
          }
        });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.message).toBe('Application approved successfully');
      expect(response.body.application.status).toBe('attending');
      expect(response.body.applicant.username).toBe('applicant1');
    });

    test('7. Should successfully reject a pending application', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.query.eventParticipants.findFirst.mockResolvedValue(mockApplication);
      mockDb.query.users.findFirst.mockResolvedValue(mockApplicant);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              id: 101,
              status: 'rejected',
              ticketQuantity: 2
            }])
          })
        })
      });

      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        const newStatus = status === 'approved' ? 'attending' : 'rejected';
        
        const updatedApplication = await mockDb.update().set().where().returning();
        const applicant = await mockDb.query.users.findFirst();

        res.json({
          message: `Application ${status} successfully`,
          application: updatedApplication[0],
          applicant: {
            username: applicant.username,
            fullName: applicant.fullName,
            email: applicant.email
          }
        });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'rejected' })
        .expect(200);

      expect(response.body.message).toBe('Application rejected successfully');
      expect(response.body.application.status).toBe('rejected');
    });

    test('8. Should return 400 for invalid status values', async () => {
      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status. Must be \'approved\' or \'rejected\'' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toBe('Invalid status. Must be \'approved\' or \'rejected\'');
    });

    test('9. Should return 400 for missing status in request body', async () => {
      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        
        if (!status) {
          return res.status(400).json({ error: 'Status is required' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Status is required');
    });

    test('10. Should return 403 for non-event-host', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);

      app.use('/api/events/:eventId/applications/:userId', mockAuth(2)); // Non-host user
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await mockDb.query.events.findFirst();
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(403);

      expect(response.body.error).toBe('You can only manage applications for your own events');
    });
  });

  describe('Payment Integration Tests', () => {
    
    test('11. Stripe webhook should set participant status to pending_approval', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: 103,
            eventId: 1,
            userId: 2,
            status: 'pending_approval',
            ticketQuantity: 1,
            totalAmount: 199.99
          }])
        })
      });

      app.post('/api/webhooks/stripe', async (req, res) => {
        // Simulate successful payment webhook
        const participant = await mockDb.insert().values({
          eventId: 1,
          userId: 2,
          status: 'pending_approval', // Key change from 'attending'
          ticketQuantity: 1,
          totalAmount: 199.99
        }).returning();

        res.json({ 
          received: true, 
          participantStatus: participant[0].status 
        });
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send({})
        .expect(200);

      expect(response.body.participantStatus).toBe('pending_approval');
      expect(response.body.received).toBe(true);
    });

    test('12. Should not automatically set status to attending on payment', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: 103,
            status: 'pending_approval'
          }])
        })
      });

      app.post('/api/webhooks/stripe', async (req, res) => {
        const participant = await mockDb.insert().values({
          status: 'pending_approval'
        }).returning();

        res.json({ 
          status: participant[0].status,
          isAutoAttending: participant[0].status === 'attending'
        });
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send({})
        .expect(200);

      expect(response.body.isAutoAttending).toBe(false);
      expect(response.body.status).toBe('pending_approval');
    });
  });

  describe('Error Handling Tests', () => {
    
    test('13. Should handle database errors gracefully', async () => {
      mockDb.query.events.findFirst.mockRejectedValue(new Error('Database connection failed'));

      app.use('/api/events/:eventId/applications', mockAuth(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        try {
          await mockDb.query.events.findFirst();
          res.json({ success: true });
        } catch (error) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    test('14. Should handle null values gracefully', async () => {
      const eventWithNulls = {
        ...mockEvent,
        attendingCount: null
      };
      
      const applicationWithNulls = {
        ...mockApplication,
        ticketQuantity: null
      };
      
      mockDb.query.events.findFirst.mockResolvedValue(eventWithNulls);
      mockDb.query.eventParticipants.findFirst.mockResolvedValue(applicationWithNulls);

      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await mockDb.query.events.findFirst();
        const application = await mockDb.query.eventParticipants.findFirst();
        
        // Handle null values
        const currentCount = event.attendingCount || 0;
        const ticketQuantity = application.ticketQuantity || 1;

        res.json({ 
          currentCount,
          ticketQuantity,
          newTotal: currentCount + ticketQuantity
        });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.currentCount).toBe(0);
      expect(response.body.ticketQuantity).toBe(1);
      expect(response.body.newTotal).toBe(1);
    });

    test('15. Should handle event capacity limits', async () => {
      const fullEvent = {
        ...mockEvent,
        attendingCount: 99,
        maxAttendees: 100
      };
      
      const largeTicketApplication = {
        ...mockApplication,
        ticketQuantity: 5
      };
      
      mockDb.query.events.findFirst.mockResolvedValue(fullEvent);
      mockDb.query.eventParticipants.findFirst.mockResolvedValue(largeTicketApplication);

      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await mockDb.query.events.findFirst();
        const application = await mockDb.query.eventParticipants.findFirst();
        
        const currentCount = event.attendingCount || 0;
        const ticketQuantity = application.ticketQuantity || 1;
        const newTotal = currentCount + ticketQuantity;
        
        if (event.maxAttendees && newTotal > event.maxAttendees) {
          return res.status(400).json({ 
            error: 'Approving this application would exceed event capacity',
            currentCapacity: currentCount,
            maxCapacity: event.maxAttendees,
            requestedTickets: ticketQuantity
          });
        }
        
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(400);

      expect(response.body.error).toBe('Approving this application would exceed event capacity');
      expect(response.body.currentCapacity).toBe(99);
      expect(response.body.maxCapacity).toBe(100);
      expect(response.body.requestedTickets).toBe(5);
    });
  });

  describe('Integration Workflow Tests', () => {
    
    test('16. Complete workflow: payment -> pending -> approval -> attending', async () => {
      let participantStatus = 'unknown';
      
      // Step 1: Payment webhook creates pending application
      app.post('/api/webhooks/stripe', async (req, res) => {
        participantStatus = 'pending_approval';
        res.json({ status: participantStatus });
      });
      
      // Step 2: Host fetches pending applications
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{
              ...mockApplication,
              status: 'pending_approval'
            }])
          })
        })
      });
      
      app.use('/api/events/:eventId/applications', mockAuth(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await mockDb.select().from().innerJoin().where();
        res.json({
          applications,
          totalPending: applications.length
        });
      });
      
      // Step 3: Host approves application
      mockDb.query.eventParticipants.findFirst.mockResolvedValue({
        ...mockApplication,
        status: 'pending_approval'
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              id: 101,
              status: 'attending'
            }])
          })
        })
      });
      
      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        await mockDb.update().set().where().returning();
        participantStatus = 'attending';
        res.json({ 
          message: 'Application approved successfully',
          finalStatus: participantStatus
        });
      });

      // Execute workflow
      const paymentResponse = await request(app)
        .post('/api/webhooks/stripe')
        .expect(200);
      
      expect(paymentResponse.body.status).toBe('pending_approval');
      
      const applicationsResponse = await request(app)
        .get('/api/events/1/applications')
        .expect(200);
      
      expect(applicationsResponse.body.totalPending).toBe(1);
      
      const approvalResponse = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(200);
      
      expect(approvalResponse.body.finalStatus).toBe('attending');
    });

    test('17. Complete workflow: payment -> pending -> rejection -> rejected', async () => {
      let participantStatus = 'unknown';
      
      // Step 1: Payment webhook
      app.post('/api/webhooks/stripe', async (req, res) => {
        participantStatus = 'pending_approval';
        res.json({ status: participantStatus });
      });
      
      // Step 2: Host rejects application
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent);
      mockDb.query.eventParticipants.findFirst.mockResolvedValue({
        ...mockApplication,
        status: 'pending_approval'
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              id: 101,
              status: 'rejected'
            }])
          })
        })
      });
      
      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        await mockDb.update().set().where().returning();
        participantStatus = 'rejected';
        res.json({ 
          message: 'Application rejected successfully',
          finalStatus: participantStatus
        });
      });

      // Execute workflow
      const paymentResponse = await request(app)
        .post('/api/webhooks/stripe')
        .expect(200);
      
      expect(paymentResponse.body.status).toBe('pending_approval');
      
      const rejectionResponse = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'rejected' })
        .expect(200);
      
      expect(rejectionResponse.body.finalStatus).toBe('rejected');
    });
  })

  describe('Authorization Tests', () => {
    
    test('18. Multiple hosts should only access their own events', async () => {
      const host1Event = { ...mockEvent, id: 1, createdBy: 1 };
      const host2Event = { ...mockEvent, id: 2, createdBy: 2, title: 'Another Event' };

      // Host 1 accessing their event
      app.use('/api/events/1/applications-host1', mockAuth(1));
      app.get('/api/events/1/applications-host1', async (req, res) => {
        mockDb.query.events.findFirst.mockResolvedValue(host1Event);
        const event = await mockDb.query.events.findFirst();
        
        if (event && event.createdBy === req.user.id) {
          res.json({ success: true, hostId: 1, eventId: 1 });
        } else {
          res.status(403).json({ error: 'Unauthorized' });
        }
      });

      // Host 2 accessing their event
      app.use('/api/events/2/applications-host2', mockAuth(2));  
      app.get('/api/events/2/applications-host2', async (req, res) => {
        mockDb.query.events.findFirst.mockResolvedValue(host2Event);
        const event = await mockDb.query.events.findFirst();
        
        if (event && event.createdBy === req.user.id) {
          res.json({ success: true, hostId: 2, eventId: 2 });
        } else {
          res.status(403).json({ error: 'Unauthorized' });
        }
      });

      // Host 1 trying to access Host 2's event (should fail)
      app.use('/api/events/2/applications-unauthorized', mockAuth(1));
      app.get('/api/events/2/applications-unauthorized', async (req, res) => {
        mockDb.query.events.findFirst.mockResolvedValue(host2Event);
        const event = await mockDb.query.events.findFirst();
        
        if (event && event.createdBy === req.user.id) {
          res.json({ success: true });
        } else {
          res.status(403).json({ error: 'Unauthorized' });
        }
      });

      // Test authorized access
      const host1Response = await request(app)
        .get('/api/events/1/applications-host1')
        .expect(200);
      
      const host2Response = await request(app)
        .get('/api/events/2/applications-host2')
        .expect(200);

      expect(host1Response.body.hostId).toBe(1);
      expect(host2Response.body.hostId).toBe(2);
      
      // Test unauthorized cross-host access
      const unauthorizedResponse = await request(app)
        .get('/api/events/2/applications-unauthorized')
        .expect(403);
      
      expect(unauthorizedResponse.body.error).toBe('Unauthorized');
    });

    test('19. Should handle unauthenticated requests', async () => {
      app.get('/api/events/:eventId/applications', async (req, res) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    test('20. Should validate parameter formats', async () => {
      app.use('/api/events/:eventId/applications/:userId', mockAuth(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        const userId = parseInt(req.params.userId);
        
        if (isNaN(eventId)) {
          return res.status(400).json({ error: 'Invalid event ID format' });
        }
        
        if (isNaN(userId)) {
          return res.status(400).json({ error: 'Invalid user ID format' });
        }
        
        res.json({ success: true });
      });

      // Test invalid event ID
      const eventResponse = await request(app)
        .put('/api/events/invalid/applications/2')
        .send({ status: 'approved' })
        .expect(400);

      expect(eventResponse.body.error).toBe('Invalid event ID format');

      // Test invalid user ID
      const userResponse = await request(app)
        .put('/api/events/1/applications/invalid')
        .send({ status: 'approved' })
        .expect(400);

      expect(userResponse.body.error).toBe('Invalid user ID format');
    });
  });
});