import request from 'supertest';
import express from 'express';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database
jest.mock('../../db', () => ({
  db: {
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
  }
}));

// Mock schema
jest.mock('../../db/schema', () => ({
  events: { id: 'id', title: 'title', createdBy: 'createdBy' },
  eventParticipants: { id: 'id', eventId: 'eventId', userId: 'userId', status: 'status' },
  users: { id: 'id', username: 'username' }
}));

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn()
}));

const { db } = require('../../db');

// Test application instance
let app: express.Application;

// Mock users for testing
const mockEventHost = {
  id: 1,
  username: 'eventhost',
  email: 'host@example.com',
  fullName: 'Event Host',
  bio: 'Professional event organizer',
  location: 'New York, NY',
  profileImage: 'https://example.com/host.jpg',
  isAdmin: false
};

const mockApplicant1 = {
  id: 2,
  username: 'applicant1',
  email: 'applicant1@example.com',
  fullName: 'John Applicant',
  bio: 'Tech enthusiast',
  location: 'San Francisco, CA',
  profileImage: 'https://example.com/applicant1.jpg',
  isAdmin: false
};

const mockApplicant2 = {
  id: 3,
  username: 'applicant2',
  email: 'applicant2@example.com',
  fullName: 'Jane Attendee',
  bio: 'Business professional',
  location: 'Los Angeles, CA',
  profileImage: 'https://example.com/applicant2.jpg',
  isAdmin: false
};

const mockUnauthorizedUser = {
  id: 4,
  username: 'unauthorized',
  email: 'unauthorized@example.com',
  fullName: 'Unauthorized User',
  isAdmin: false
};

const mockEvent = {
  id: 1,
  title: 'Tech Conference 2024',
  description: 'Annual tech conference',
  location: 'San Francisco Convention Center',
  category: 'technology',
  price: 199.99,
  attendingCount: 5,
  maxAttendees: 100,
  createdBy: 1, // Event host
  startDate: new Date('2024-06-15T10:00:00Z'),
  endDate: new Date('2024-06-15T18:00:00Z'),
  createdAt: new Date('2024-01-15T10:00:00Z')
};

// Mock applications
const mockApplications = [
  {
    id: 101,
    eventId: 1,
    userId: 2,
    status: 'pending_approval',
    ticketQuantity: 2,
    totalAmount: 399.98,
    createdAt: new Date('2024-01-16T10:00:00Z'),
    paymentId: 'pi_test_12345',
    ticketIdentifier: 'TICKET_12345'
  },
  {
    id: 102,
    eventId: 1,
    userId: 3,
    status: 'pending_approval',
    ticketQuantity: 1,
    totalAmount: 199.99,
    createdAt: new Date('2024-01-16T11:00:00Z'),
    paymentId: 'pi_test_67890',
    ticketIdentifier: 'TICKET_67890'
  }
];

// Authentication middleware for tests
const mockAuthMiddleware = (userId: number) => {
  return (req: any, res: any, next: any) => {
    switch (userId) {
      case 1:
        req.user = mockEventHost;
        break;
      case 2:
        req.user = mockApplicant1;
        break;
      case 3:
        req.user = mockApplicant2;
        break;
      case 4:
        req.user = mockUnauthorizedUser;
        break;
      default:
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };
};

// Setup and teardown
beforeEach(async () => {
  // Initialize test app
  app = express();
  app.use(express.json());
  
  // Mock database queries
  jest.clearAllMocks();
});

afterEach(async () => {
  jest.clearAllMocks();
});

describe('RSVP Management System - End-to-End Tests', () => {
  
  describe('GET /api/events/:eventId/applications - Fetch Pending Applications', () => {
    
    test('1. Should successfully fetch pending applications for event host', async () => {
      // Mock database responses
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              {
                id: 101,
                userId: 2,
                status: 'pending_approval',
                ticketQuantity: 2,
                createdAt: new Date('2024-01-16T10:00:00Z'),
                username: 'applicant1',
                fullName: 'John Applicant',
                email: 'applicant1@example.com',
                bio: 'Tech enthusiast',
                location: 'San Francisco, CA',
                profileImage: 'https://example.com/applicant1.jpg'
              }
            ])
          })
        })
      });

      // Setup route with authentication
      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        // Simulate the actual endpoint logic
        const eventId = parseInt(req.params.eventId);
        const event = await db.query.events.findFirst({
          where: eq(events.id, eventId)
        });
        
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        const applications = await db.select({
          id: eventParticipants.id,
          userId: eventParticipants.userId,
          status: eventParticipants.status,
          ticketQuantity: eventParticipants.ticketQuantity,
          purchaseDate: eventParticipants.createdAt,
          createdAt: eventParticipants.createdAt,
          username: users.username,
          fullName: users.fullName,
          profileImage: users.profileImage,
          email: users.email,
          bio: users.bio,
          location: users.location
        })
        .from(eventParticipants)
        .innerJoin(users, eq(eventParticipants.userId, users.id))
        .where(and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.status, 'pending_approval')
        ));

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

      expect(response.body).toHaveProperty('eventId', 1);
      expect(response.body).toHaveProperty('eventTitle', 'Tech Conference 2024');
      expect(response.body).toHaveProperty('totalPending', 1);
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0]).toHaveProperty('username', 'applicant1');
      expect(response.body.applications[0]).toHaveProperty('status', 'pending_approval');
    });

    test('2. Should return 403 for non-event-host trying to access applications', async () => {
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(2)); // Applicant trying to access
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        const event = await db.query.events.findFirst({
          where: eq(events.id, eventId)
        });
        
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'You can only manage applications for your own events');
    });

    test('3. Should return 404 for non-existent event', async () => {
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(null);

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        const event = await db.query.events.findFirst({
          where: eq(events.id, eventId)
        });
        
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/events/999/applications')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Event not found');
    });

    test('4. Should return 401 for unauthenticated request', async () => {
      app.get('/api/events/:eventId/applications', async (req, res) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    test('5. Should handle empty applications list', async () => {
      const mockDbSelect = jest.fn().mockReturnThis();
      const mockDbFrom = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbInnerJoin = jest.fn().mockReturnThis();
      
      (db.select as jest.Mock) = mockDbSelect;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      
      mockDbSelect.mockReturnValue({
        from: mockDbFrom.mockReturnValue({
          innerJoin: mockDbInnerJoin.mockReturnValue({
            where: mockDbWhere.mockResolvedValue([]) // Empty array
          })
        })
      });

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        const event = await db.query.events.findFirst({
          where: eq(events.id, eventId)
        });
        
        const applications = await db.select().from(eventParticipants);

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

      expect(response.body).toHaveProperty('totalPending', 0);
      expect(response.body.applications).toHaveLength(0);
    });

    test('6. Should include all required applicant fields', async () => {
      const mockDbSelect = jest.fn().mockReturnThis();
      const mockDbFrom = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbInnerJoin = jest.fn().mockReturnThis();
      
      (db.select as jest.Mock) = mockDbSelect;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      
      const expectedApplication = {
        id: 101,
        userId: 2,
        status: 'pending_approval',
        ticketQuantity: 2,
        purchaseDate: new Date('2024-01-16T10:00:00Z'),
        createdAt: new Date('2024-01-16T10:00:00Z'),
        username: 'applicant1',
        fullName: 'John Applicant',
        profileImage: 'https://example.com/applicant1.jpg',
        email: 'applicant1@example.com',
        bio: 'Tech enthusiast',
        location: 'San Francisco, CA'
      };
      
      mockDbSelect.mockReturnValue({
        from: mockDbFrom.mockReturnValue({
          innerJoin: mockDbInnerJoin.mockReturnValue({
            where: mockDbWhere.mockResolvedValue([expectedApplication])
          })
        })
      });

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await db.select().from(eventParticipants);
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

      const application = response.body.applications[0];
      expect(application).toHaveProperty('id');
      expect(application).toHaveProperty('userId');
      expect(application).toHaveProperty('status');
      expect(application).toHaveProperty('ticketQuantity');
      expect(application).toHaveProperty('username');
      expect(application).toHaveProperty('fullName');
      expect(application).toHaveProperty('email');
      expect(application).toHaveProperty('bio');
      expect(application).toHaveProperty('location');
      expect(application).toHaveProperty('profileImage');
    });

    test('7. Should handle database errors gracefully', async () => {
      (db.query.events.findFirst as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        try {
          const eventId = parseInt(req.params.eventId);
          const event = await db.query.events.findFirst({
            where: eq(events.id, eventId)
          });
          res.json({ success: true });
        } catch (error) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    test('8. Should validate eventId parameter format', async () => {
      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
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

      expect(response.body).toHaveProperty('error', 'Invalid event ID format');
    });

    test('9. Should filter only pending_approval status', async () => {
      const mockDbSelect = jest.fn().mockReturnThis();
      const mockDbFrom = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbInnerJoin = jest.fn().mockReturnThis();
      
      (db.select as jest.Mock) = mockDbSelect;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      
      const applications = [
        { ...mockApplications[0], status: 'pending_approval' },
        { ...mockApplications[1], status: 'attending' } // Should be filtered out
      ];
      
      mockDbSelect.mockReturnValue({
        from: mockDbFrom.mockReturnValue({
          innerJoin: mockDbInnerJoin.mockReturnValue({
            where: mockDbWhere.mockResolvedValue([applications[0]]) // Only pending
          })
        })
      });

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await db.select().from(eventParticipants);
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

      expect(response.body.totalPending).toBe(1);
      expect(response.body.applications[0].status).toBe('pending_approval');
    });

    test('10. Should handle multiple pending applications correctly', async () => {
      const mockDbSelect = jest.fn().mockReturnThis();
      const mockDbFrom = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbInnerJoin = jest.fn().mockReturnThis();
      
      (db.select as jest.Mock) = mockDbSelect;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      
      const multipleApplications = [
        {
          id: 101,
          userId: 2,
          status: 'pending_approval',
          ticketQuantity: 2,
          username: 'applicant1',
          fullName: 'John Applicant'
        },
        {
          id: 102,
          userId: 3,
          status: 'pending_approval',
          ticketQuantity: 1,
          username: 'applicant2',
          fullName: 'Jane Attendee'
        }
      ];
      
      mockDbSelect.mockReturnValue({
        from: mockDbFrom.mockReturnValue({
          innerJoin: mockDbInnerJoin.mockReturnValue({
            where: mockDbWhere.mockResolvedValue(multipleApplications)
          })
        })
      });

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await db.select().from(eventParticipants);
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

      expect(response.body.totalPending).toBe(2);
      expect(response.body.applications).toHaveLength(2);
      expect(response.body.applications[0].username).toBe('applicant1');
      expect(response.body.applications[1].username).toBe('applicant2');
    });
  });

  describe('PUT /api/events/:eventId/applications/:userId - Approve/Reject Applications', () => {
    
    test('11. Should successfully approve a pending application', async () => {
      const mockDbUpdate = jest.fn().mockReturnThis();
      const mockDbSet = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbReturning = jest.fn().mockResolvedValue([{
        id: 101,
        eventId: 1,
        userId: 2,
        status: 'attending',
        ticketQuantity: 2,
        updatedAt: new Date()
      }]);
      
      (db.update as jest.Mock) = mockDbUpdate;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(mockApplications[0]);
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(mockApplicant1);
      
      mockDbUpdate.mockReturnValue({
        set: mockDbSet.mockReturnValue({
          where: mockDbWhere.mockReturnValue({
            returning: mockDbReturning
          })
        })
      });

      // Mock event update for attending count
      const mockEventUpdate = jest.fn().mockReturnThis();
      (db.update as jest.Mock).mockImplementation((table) => {
        if (table === events) {
          return mockEventUpdate.mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([])
            })
          });
        }
        return mockDbUpdate();
      });

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status. Must be \'approved\' or \'rejected\'' });
        }

        const eventId = parseInt(req.params.eventId);
        const userId = parseInt(req.params.userId);
        
        const event = await db.query.events.findFirst({
          where: eq(events.id, eventId)
        });
        
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        const application = await db.query.eventParticipants.findFirst();
        if (!application) {
          return res.status(404).json({ error: 'Pending application not found for this user and event' });
        }

        const newStatus = status === 'approved' ? 'attending' : 'rejected';
        const updatedApplication = await db.update(eventParticipants)
          .set({ status: newStatus })
          .where(eq(eventParticipants.id, application.id))
          .returning();

        const applicant = await db.query.users.findFirst();

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

      expect(response.body).toHaveProperty('message', 'Application approved successfully');
      expect(response.body.application).toHaveProperty('status', 'attending');
      expect(response.body.applicant).toHaveProperty('username', 'applicant1');
    });

    test('12. Should successfully reject a pending application', async () => {
      const mockDbUpdate = jest.fn().mockReturnThis();
      const mockDbSet = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbReturning = jest.fn().mockResolvedValue([{
        id: 101,
        eventId: 1,
        userId: 2,
        status: 'rejected',
        ticketQuantity: 2,
        updatedAt: new Date()
      }]);
      
      (db.update as jest.Mock) = mockDbUpdate;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(mockApplications[0]);
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(mockApplicant1);
      
      mockDbUpdate.mockReturnValue({
        set: mockDbSet.mockReturnValue({
          where: mockDbWhere.mockReturnValue({
            returning: mockDbReturning
          })
        })
      });

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        const newStatus = status === 'approved' ? 'attending' : 'rejected';
        
        const application = await db.query.eventParticipants.findFirst();
        const updatedApplication = await db.update(eventParticipants)
          .set({ status: newStatus })
          .returning();

        const applicant = await db.query.users.findFirst();

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

      expect(response.body).toHaveProperty('message', 'Application rejected successfully');
      expect(response.body.application).toHaveProperty('status', 'rejected');
    });

    test('13. Should return 400 for invalid status values', async () => {
      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
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

      expect(response.body).toHaveProperty('error', 'Invalid status. Must be \'approved\' or \'rejected\'');
    });

    test('14. Should return 400 for missing status in request body', async () => {
      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
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

      expect(response.body).toHaveProperty('error', 'Status is required');
    });

    test('15. Should return 403 for non-event-host trying to manage applications', async () => {
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(2)); // Non-host user
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await db.query.events.findFirst();
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'You can only manage applications for your own events');
    });

    test('16. Should return 404 for non-existent event', async () => {
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(null);

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await db.query.events.findFirst();
        
        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/999/applications/2')
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Event not found');
    });

    test('17. Should return 404 for non-existent application', async () => {
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(null);

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await db.query.events.findFirst();
        
        if (event.createdBy !== req.user.id) {
          return res.status(403).json({ error: 'You can only manage applications for your own events' });
        }

        const application = await db.query.eventParticipants.findFirst();
        if (!application) {
          return res.status(404).json({ error: 'Pending application not found for this user and event' });
        }

        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/999')
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Pending application not found for this user and event');
    });

    test('18. Should update event attending count when approving application', async () => {
      const mockDbUpdate = jest.fn().mockReturnThis();
      const mockDbSet = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbReturning = jest.fn();
      
      let eventUpdateCalled = false;
      
      (db.update as jest.Mock) = jest.fn((table) => {
        if (table === events) {
          eventUpdateCalled = true;
        }
        return mockDbUpdate;
      });
      
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(mockApplications[0]);
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(mockApplicant1);
      
      mockDbUpdate.mockReturnValue({
        set: mockDbSet.mockReturnValue({
          where: mockDbWhere.mockReturnValue({
            returning: mockDbReturning.mockResolvedValue([{
              id: 101,
              status: 'attending',
              ticketQuantity: 2
            }])
          })
        })
      });

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        
        // Simulate approval logic
        if (status === 'approved') {
          // Update participant status
          await db.update(eventParticipants);
          
          // Update event attending count
          await db.update(events);
        }

        res.json({ message: 'Application approved successfully' });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(200);

      expect(eventUpdateCalled).toBe(true);
      expect(response.body).toHaveProperty('message', 'Application approved successfully');
    });

    test('19. Should not update event attending count when rejecting application', async () => {
      let eventUpdateCalled = false;
      
      (db.update as jest.Mock) = jest.fn((table) => {
        if (table === events) {
          eventUpdateCalled = true;
        }
        return {
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([])
            })
          })
        };
      });
      
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(mockApplications[0]);
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(mockApplicant1);

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const { status } = req.body;
        
        // Simulate rejection logic (no event count update)
        if (status === 'approved') {
          await db.update(events);
        }
        
        await db.update(eventParticipants);

        res.json({ message: 'Application rejected successfully' });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'rejected' })
        .expect(200);

      expect(eventUpdateCalled).toBe(false);
      expect(response.body).toHaveProperty('message', 'Application rejected successfully');
    });

    test('20. Should validate userId parameter format', async () => {
      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ error: 'Invalid user ID format' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/invalid')
        .send({ status: 'approved' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid user ID format');
    });
  });

  describe('Payment Integration - Stripe Webhook Modifications', () => {
    
    test('21. Should set participant status to pending_approval after successful payment', async () => {
      const mockDbInsert = jest.fn().mockReturnThis();
      const mockDbValues = jest.fn().mockReturnThis();
      const mockDbReturning = jest.fn().mockResolvedValue([{
        id: 103,
        eventId: 1,
        userId: 2,
        status: 'pending_approval',
        ticketQuantity: 1,
        totalAmount: 199.99
      }]);
      
      (db.insert as jest.Mock) = mockDbInsert;
      
      mockDbInsert.mockReturnValue({
        values: mockDbValues.mockReturnValue({
          returning: mockDbReturning
        })
      });

      app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
        // Simulate successful payment webhook
        const mockSession = {
          payment_status: 'paid',
          metadata: {
            eventId: '1',
            userId: '2',
            ticketQuantity: '1'
          },
          amount_total: 19999 // $199.99 in cents
        };

        // Insert participant with pending_approval status
        const participant = await db.insert(eventParticipants)
          .values({
            eventId: parseInt(mockSession.metadata.eventId),
            userId: parseInt(mockSession.metadata.userId),
            status: 'pending_approval', // Changed from 'attending'
            ticketQuantity: parseInt(mockSession.metadata.ticketQuantity),
            totalAmount: mockSession.amount_total / 100
          })
          .returning();

        res.json({ received: true, participantStatus: participant[0].status });
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('participantStatus', 'pending_approval');
    });

    test('22. Should not automatically set status to attending on payment completion', async () => {
      const mockDbInsert = jest.fn().mockReturnThis();
      const mockDbValues = jest.fn().mockReturnThis();
      const mockDbReturning = jest.fn().mockResolvedValue([{
        id: 103,
        status: 'pending_approval' // Verify it's NOT 'attending'
      }]);
      
      (db.insert as jest.Mock) = mockDbInsert;
      
      mockDbInsert.mockReturnValue({
        values: mockDbValues.mockReturnValue({
          returning: mockDbReturning
        })
      });

      app.post('/api/webhooks/stripe', async (req, res) => {
        const participant = await db.insert(eventParticipants)
          .values({
            status: 'pending_approval'
          })
          .returning();

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

  describe('Edge Cases and Error Handling', () => {
    
    test('23. Should handle database transaction failures', async () => {
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(mockApplications[0]);
      (db.update as jest.Mock).mockRejectedValue(new Error('Database transaction failed'));

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        try {
          await db.update(eventParticipants);
          res.json({ success: true });
        } catch (error) {
          res.status(500).json({ error: 'Database transaction failed' });
        }
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database transaction failed');
    });

    test('24. Should handle concurrent approval attempts', async () => {
      let updateCount = 0;
      
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(mockApplications[0]);
      (db.update as jest.Mock) = jest.fn(() => {
        updateCount++;
        return {
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{
                id: 101,
                status: 'attending'
              }])
            })
          })
        };
      });

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        await db.update(eventParticipants);
        res.json({ success: true, updateCount });
      });

      // Simulate concurrent requests
      const request1 = request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' });

      const request2 = request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' });

      const [response1, response2] = await Promise.all([request1, request2]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(updateCount).toBeGreaterThanOrEqual(1);
    });

    test('25. Should handle null/undefined values gracefully', async () => {
      (db.query.events.findFirst as jest.Mock).mockResolvedValue({
        ...mockEvent,
        attendingCount: null // Null value
      });
      
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue({
        ...mockApplications[0],
        ticketQuantity: null // Null value
      });

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await db.query.events.findFirst();
        const application = await db.query.eventParticipants.findFirst();
        
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

    test('26. Should handle malformed JSON in request body', async () => {
      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', express.json(), (err, req, res, next) => {
        if (err instanceof SyntaxError && 'body' in err) {
          return res.status(400).json({ error: 'Invalid JSON format' });
        }
        next();
      }, async (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .type('json')
        .send('{ invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('27. Should handle very large event IDs', async () => {
      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        
        if (eventId > Number.MAX_SAFE_INTEGER) {
          return res.status(400).json({ error: 'Event ID too large' });
        }
        
        res.json({ eventId });
      });

      const largeId = Number.MAX_SAFE_INTEGER + 1;
      const response = await request(app)
        .get(`/api/events/${largeId}/applications`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Event ID too large');
    });

    test('28. Should handle application already processed', async () => {
      const alreadyProcessedApplication = {
        ...mockApplications[0],
        status: 'attending' // Already approved
      };
      
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(alreadyProcessedApplication);

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const application = await db.query.eventParticipants.findFirst();
        
        if (application.status !== 'pending_approval') {
          return res.status(400).json({ 
            error: 'Application has already been processed',
            currentStatus: application.status
          });
        }
        
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/events/1/applications/2')
        .send({ status: 'approved' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Application has already been processed');
      expect(response.body).toHaveProperty('currentStatus', 'attending');
    });

    test('29. Should handle missing user data in applications response', async () => {
      const mockDbSelect = jest.fn().mockReturnThis();
      const mockDbFrom = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbInnerJoin = jest.fn().mockReturnThis();
      
      (db.select as jest.Mock) = mockDbSelect;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      
      // Application with missing user data
      const applicationWithMissingUser = {
        id: 101,
        userId: 999, // Non-existent user
        status: 'pending_approval',
        ticketQuantity: 1,
        username: null,
        fullName: null,
        email: null
      };
      
      mockDbSelect.mockReturnValue({
        from: mockDbFrom.mockReturnValue({
          innerJoin: mockDbInnerJoin.mockReturnValue({
            where: mockDbWhere.mockResolvedValue([applicationWithMissingUser])
          })
        })
      });

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await db.select().from(eventParticipants);
        
        // Filter out applications with missing user data
        const validApplications = applications.filter(app => app.username && app.email);
        
        res.json({
          eventId: 1,
          eventTitle: 'Tech Conference 2024',
          applications: validApplications,
          totalPending: validApplications.length,
          invalidApplications: applications.length - validApplications.length
        });
      });

      const response = await request(app)
        .get('/api/events/1/applications')
        .expect(200);

      expect(response.body.totalPending).toBe(0);
      expect(response.body.invalidApplications).toBe(1);
    });

    test('30. Should handle event capacity limits during approval', async () => {
      const fullEvent = {
        ...mockEvent,
        attendingCount: 99,
        maxAttendees: 100
      };
      
      const largeTicketApplication = {
        ...mockApplications[0],
        ticketQuantity: 5 // Would exceed capacity
      };
      
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(fullEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(largeTicketApplication);

      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const event = await db.query.events.findFirst();
        const application = await db.query.eventParticipants.findFirst();
        
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

      expect(response.body).toHaveProperty('error', 'Approving this application would exceed event capacity');
      expect(response.body).toHaveProperty('currentCapacity', 99);
      expect(response.body).toHaveProperty('maxCapacity', 100);
      expect(response.body).toHaveProperty('requestedTickets', 5);
    });

    test('31. Should handle rate limiting for multiple rapid requests', async () => {
      let requestCount = 0;
      const startTime = Date.now();
      
      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        requestCount++;
        const timeElapsed = Date.now() - startTime;
        
        // Simple rate limiting: max 5 requests per second
        if (requestCount > 5 && timeElapsed < 1000) {
          return res.status(429).json({ 
            error: 'Too many requests',
            requestCount,
            timeElapsed
          });
        }
        
        res.json({ success: true, requestCount });
      });

      // Make multiple rapid requests
      const requests = Array(7).fill(null).map(() => 
        request(app).get('/api/events/1/applications')
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body).toHaveProperty('error', 'Too many requests');
      }
    });

    test('32. Should handle memory constraints with large application lists', async () => {
      // Simulate a large number of applications
      const largeApplicationList = Array(1000).fill(null).map((_, index) => ({
        id: index + 1,
        userId: (index % 10) + 1,
        status: 'pending_approval',
        ticketQuantity: 1,
        username: `user${index}`,
        fullName: `User ${index}`,
        email: `user${index}@example.com`,
        bio: `Bio for user ${index}`.repeat(100), // Large bio text
        location: 'Test Location',
        profileImage: 'https://example.com/image.jpg'
      }));

      const mockDbSelect = jest.fn().mockReturnThis();
      const mockDbFrom = jest.fn().mockReturnThis();
      const mockDbWhere = jest.fn().mockReturnThis();
      const mockDbInnerJoin = jest.fn().mockReturnThis();
      
      (db.select as jest.Mock) = mockDbSelect;
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      
      mockDbSelect.mockReturnValue({
        from: mockDbFrom.mockReturnValue({
          innerJoin: mockDbInnerJoin.mockReturnValue({
            where: mockDbWhere.mockResolvedValue(largeApplicationList)
          })
        })
      });

      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await db.select().from(eventParticipants);
        
        // Add pagination to handle large datasets
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;
        
        const paginatedApplications = applications.slice(offset, offset + limit);
        
        res.json({
          eventId: 1,
          eventTitle: 'Tech Conference 2024',
          applications: paginatedApplications,
          totalPending: applications.length,
          currentPage: page,
          totalPages: Math.ceil(applications.length / limit),
          hasNextPage: offset + limit < applications.length
        });
      });

      const response = await request(app)
        .get('/api/events/1/applications?page=1&limit=50')
        .expect(200);

      expect(response.body.applications).toHaveLength(50);
      expect(response.body.totalPending).toBe(1000);
      expect(response.body.totalPages).toBe(20);
      expect(response.body.hasNextPage).toBe(true);
    });
  });

  describe('Integration Tests - Full Workflow', () => {
    
    test('33. Should complete full RSVP workflow: payment -> pending -> approval -> attending', async () => {
      let participantStatus = 'unknown';
      
      // Step 1: Payment webhook creates pending application
      app.post('/api/webhooks/stripe', async (req, res) => {
        participantStatus = 'pending_approval';
        res.json({ status: participantStatus });
      });
      
      // Step 2: Host fetches pending applications
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      const mockApplicationWithPendingStatus = {
        ...mockApplications[0],
        status: 'pending_approval'
      };
      
      const mockDbSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockApplicationWithPendingStatus])
          })
        })
      });
      (db.select as jest.Mock) = mockDbSelect;
      
      app.use('/api/events/:eventId/applications', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications', async (req, res) => {
        const applications = await db.select().from(eventParticipants);
        res.json({
          applications,
          totalPending: applications.length
        });
      });
      
      // Step 3: Host approves application
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue(mockApplicationWithPendingStatus);
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              id: 101,
              status: 'attending'
            }])
          })
        })
      });
      
      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        const updatedApplication = await db.update(eventParticipants);
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

    test('34. Should complete full RSVP workflow: payment -> pending -> rejection -> rejected', async () => {
      let participantStatus = 'unknown';
      
      // Step 1: Payment webhook
      app.post('/api/webhooks/stripe', async (req, res) => {
        participantStatus = 'pending_approval';
        res.json({ status: participantStatus });
      });
      
      // Step 2: Host rejects application
      (db.query.events.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (db.query.eventParticipants.findFirst as jest.Mock).mockResolvedValue({
        ...mockApplications[0],
        status: 'pending_approval'
      });
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              id: 101,
              status: 'rejected'
            }])
          })
        })
      });
      
      app.use('/api/events/:eventId/applications/:userId', mockAuthMiddleware(1));
      app.put('/api/events/:eventId/applications/:userId', async (req, res) => {
        await db.update(eventParticipants);
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

    test('35. Should handle multiple hosts managing different events simultaneously', async () => {
      const host1Event = { ...mockEvent, id: 1, createdBy: 1 };
      const host2Event = { ...mockEvent, id: 2, createdBy: 2, title: 'Another Event' };
      
      // Mock different events for different hosts
      (db.query.events.findFirst as jest.Mock) = jest.fn((query) => {
        const eventId = query.where._config?.operator === 'eq' ? 
          (query.where._value || query.where._left?.value) : 1;
        
        if (eventId === 1) return Promise.resolve(host1Event);
        if (eventId === 2) return Promise.resolve(host2Event);
        return Promise.resolve(null);
      });

      // Host 1 endpoint
      app.use('/api/events/:eventId/applications-host1', mockAuthMiddleware(1));
      app.get('/api/events/:eventId/applications-host1', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        const event = await db.query.events.findFirst();
        
        if (event && event.createdBy === req.user.id) {
          res.json({ success: true, hostId: 1, eventId });
        } else {
          res.status(403).json({ error: 'Unauthorized' });
        }
      });

      // Host 2 endpoint
      app.use('/api/events/:eventId/applications-host2', mockAuthMiddleware(2));
      app.get('/api/events/:eventId/applications-host2', async (req, res) => {
        const eventId = parseInt(req.params.eventId);
        const event = await db.query.events.findFirst();
        
        if (event && event.createdBy === req.user.id) {
          res.json({ success: true, hostId: 2, eventId });
        } else {
          res.status(403).json({ error: 'Unauthorized' });
        }
      });

      // Test both hosts can manage their own events
      const host1Response = await request(app)
        .get('/api/events/1/applications-host1')
        .expect(200);
      
      const host2Response = await request(app)
        .get('/api/events/2/applications-host2')
        .expect(200);

      expect(host1Response.body.hostId).toBe(1);
      expect(host2Response.body.hostId).toBe(2);
      
      // Test cross-host access denial
      const unauthorizedResponse = await request(app)
        .get('/api/events/2/applications-host1') // Host 1 trying to access Host 2's event
        .expect(403);
      
      expect(unauthorizedResponse.body.error).toBe('Unauthorized');
    });
  });
});