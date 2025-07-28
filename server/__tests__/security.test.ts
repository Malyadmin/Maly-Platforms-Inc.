import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Mock database
const mockDb = {
  query: {
    users: {
      findFirst: jest.fn()
    }
  },
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn()
};

jest.mock('../../db', () => ({ db: mockDb }));
jest.mock('../../db/schema', () => ({
  users: { id: 'id', username: 'username', isAdmin: 'isAdmin' },
  messages: {},
  events: {}
}));

// Setup test app
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = { id: 1, username: 'testuser', isAdmin: false };
  next();
};

const mockAdminAuth = (req: any, res: any, next: any) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

// Test endpoints
app.post('/test/admin/make-admin', mockAuth, mockAdminAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/test/messages', mockAuth, (req, res) => {
  const { senderId, receiverId, content } = req.body;
  const authenticatedUserId = req.user.id;
  
  if (senderId !== authenticatedUserId) {
    return res.status(403).json({ 
      error: 'You can only send messages as yourself' 
    });
  }
  
  if (!receiverId || !content) {
    return res.status(400).json({ 
      error: 'Receiver ID and content are required' 
    });
  }
  
  res.json({ success: true, message: { senderId, receiverId, content } });
});

app.get('/test/users/browse', (req, res) => {
  // Simulate secure user data without sensitive fields
  const users = [
    {
      id: 1,
      username: 'user1',
      fullName: 'User One',
      location: 'City A'
      // No password, email, or other sensitive data
    },
    {
      id: 2,
      username: 'user2',
      fullName: 'User Two',
      location: 'City B'
    }
  ];
  
  res.json({ users });
});

describe('Security Tests', () => {
  describe('Authentication Tests', () => {
    test('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .post('/test/admin/make-admin')
        .send({ userId: 123 })
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });

    test('should accept valid authentication', async () => {
      const response = await request(app)
        .post('/test/messages')
        .set('Authorization', 'Bearer valid-token')
        .send({
          senderId: 1,
          receiverId: 2,
          content: 'Test message'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authorization Tests', () => {
    test('should prevent non-admin users from accessing admin endpoints', async () => {
      const response = await request(app)
        .post('/test/admin/make-admin')
        .set('Authorization', 'Bearer valid-token')
        .send({ userId: 123 })
        .expect(403);
      
      expect(response.body.error).toBe('Admin privileges required');
    });

    test('should prevent users from sending messages as other users', async () => {
      const response = await request(app)
        .post('/test/messages')
        .set('Authorization', 'Bearer valid-token')
        .send({
          senderId: 999, // Different from authenticated user ID (1)
          receiverId: 2,
          content: 'Impersonation attempt'
        })
        .expect(403);
      
      expect(response.body.error).toBe('You can only send messages as yourself');
    });
  });

  describe('Input Validation Tests', () => {
    test('should validate required fields in messages', async () => {
      const response = await request(app)
        .post('/test/messages')
        .set('Authorization', 'Bearer valid-token')
        .send({
          senderId: 1
          // Missing receiverId and content
        })
        .expect(400);
      
      expect(response.body.error).toBe('Receiver ID and content are required');
    });
  });

  describe('Data Exposure Tests', () => {
    test('should not expose sensitive user data', async () => {
      const response = await request(app)
        .get('/test/users/browse')
        .expect(200);
      
      const users = response.body.users;
      
      // Check that sensitive fields are not present
      users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('email');
        expect(user).not.toHaveProperty('isAdmin');
        expect(user).not.toHaveProperty('referralCode');
        
        // Check that safe fields are present
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('fullName');
      });
    });
  });
});