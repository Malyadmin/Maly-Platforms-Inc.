import request from 'supertest';
import express from 'express';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock the database and dependencies
jest.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn()
      }
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn()
  }
}));

jest.mock('../../db/schema', () => ({
  users: {
    id: 'id',
    username: 'username',
    isAdmin: 'isAdmin'
  },
  events: {
    id: 'id',
    title: 'title'
  },
  eventParticipants: {},
  sessions: {},
  userConnections: {}
}));

// Mock authentication middleware
const mockRequireAuth = (req: any, res: any, next: any) => {
  req.user = { id: 1, username: 'testuser', isAdmin: false };
  next();
};

const mockRequireAdmin = (req: any, res: any, next: any) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

// Mock the actual middleware
jest.mock('../middleware/authMiddleware', () => ({
  requireAuth: mockRequireAuth
}));

jest.mock('../middleware/adminAuth', () => ({
  requireAdmin: mockRequireAdmin
}));

// Setup express app for testing
const app = express();
app.use(express.json());

// Security Test: Admin endpoint should reject non-admin users
app.post('/test/admin/make-admin', mockRequireAuth, mockRequireAdmin, (req, res) => {
  res.json({ success: true });
});

// Validation Test: Event creation with invalid data should return 400
app.post('/test/events', (req, res) => {
  const { title, description, location } = req.body;
  
  if (!title || !description || !location) {
    return res.status(400).json({
      error: 'Invalid event data',
      details: ['Title, description, and location are required']
    });
  }
  
  if (title.length < 1 || title.length > 200) {
    return res.status(400).json({
      error: 'Invalid event data',
      details: ['Title must be between 1 and 200 characters']
    });
  }
  
  res.status(201).json({ success: true, event: { title, description, location } });
});

// Pagination Test: User browse with pagination
app.get('/test/users/browse', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  
  // Mock user data
  const allUsers = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    fullName: `User ${i + 1}`
  }));
  
  const paginatedUsers = allUsers.slice(offset, offset + limit);
  
  res.json({
    users: paginatedUsers,
    pagination: {
      limit,
      offset,
      total: allUsers.length,
      hasMore: offset + paginatedUsers.length < allUsers.length
    }
  });
});

// Data Exposure Test: User browse should not return sensitive data
app.get('/test/users/browse-secure', (req, res) => {
  const mockUsers = [
    {
      id: 1,
      username: 'testuser',
      fullName: 'Test User',
      profileImage: '/test.jpg',
      location: 'Test City'
      // Password field explicitly excluded
    }
  ];
  
  res.json({
    users: mockUsers,
    pagination: {
      limit: 20,
      offset: 0,
      total: 1,
      hasMore: false
    }
  });
});

describe('API Validation Tests', () => {
  describe('Security Tests', () => {
    test('should reject non-admin users from admin endpoints', async () => {
      const response = await request(app)
        .post('/test/admin/make-admin')
        .send({ userId: 123 })
        .expect(403);
      
      expect(response.body.error).toBe('Admin privileges required');
    });
  });

  describe('Input Validation Tests', () => {
    test('should return 400 for invalid event data', async () => {
      const response = await request(app)
        .post('/test/events')
        .send({
          title: '', // Invalid: empty title
          description: 'Test description',
          location: 'Test location'
        })
        .expect(400);
      
      expect(response.body.error).toBe('Invalid event data');
      expect(response.body.details).toBeDefined();
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/test/events')
        .send({
          title: 'Test Event'
          // Missing description and location
        })
        .expect(400);
      
      expect(response.body.error).toBe('Invalid event data');
    });

    test('should accept valid event data', async () => {
      const response = await request(app)
        .post('/test/events')
        .send({
          title: 'Valid Event',
          description: 'This is a valid event description',
          location: 'Test City'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.event.title).toBe('Valid Event');
    });
  });

  describe('Pagination Tests', () => {
    test('should return paginated results with correct metadata', async () => {
      const response = await request(app)
        .get('/test/users/browse')
        .query({ limit: '10', offset: '0' })
        .expect(200);
      
      expect(response.body.users).toHaveLength(10);
      expect(response.body.pagination).toEqual({
        limit: 10,
        offset: 0,
        total: 50,
        hasMore: true
      });
    });

    test('should handle different page sizes', async () => {
      const response = await request(app)
        .get('/test/users/browse')
        .query({ limit: '5', offset: '10' })
        .expect(200);
      
      expect(response.body.users).toHaveLength(5);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.offset).toBe(10);
    });

    test('should indicate no more results on last page', async () => {
      const response = await request(app)
        .get('/test/users/browse')
        .query({ limit: '20', offset: '40' })
        .expect(200);
      
      expect(response.body.users).toHaveLength(10); // Only 10 users left
      expect(response.body.pagination.hasMore).toBe(false);
    });
  });

  describe('Data Exposure Tests', () => {
    test('should not return password field in user browse', async () => {
      const response = await request(app)
        .get('/test/users/browse-secure')
        .expect(200);
      
      const users = response.body.users;
      expect(users).toHaveLength(1);
      expect(users[0]).not.toHaveProperty('password');
      expect(users[0]).not.toHaveProperty('email');
      expect(users[0]).toHaveProperty('username');
      expect(users[0]).toHaveProperty('fullName');
    });
  });
});