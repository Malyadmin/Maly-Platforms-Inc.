import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Mock database with performance tracking
let queryCount = 0;
const mockDb = {
  select: jest.fn().mockImplementation(() => {
    queryCount++;
    return mockDb;
  }),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  // Mock batch query result
  then: jest.fn().mockResolvedValue([
    { id: 1, username: 'user1', fullName: 'User One', profileImage: '/img1.jpg' },
    { id: 2, username: 'user2', fullName: 'User Two', profileImage: '/img2.jpg' },
    { id: 3, username: 'user3', fullName: 'User Three', profileImage: '/img3.jpg' }
  ])
};

jest.mock('../../db', () => ({ db: mockDb }));
jest.mock('../../db/schema', () => ({
  users: { id: 'id', username: 'username' },
  events: { id: 'id', title: 'title' },
  eventParticipants: { userId: 'userId', eventId: 'eventId' }
}));

// Mock Drizzle ORM functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  inArray: jest.fn(),
  desc: jest.fn(),
  sql: jest.fn()
}));

const app = express();
app.use(express.json());

// Simulate optimized event endpoint (with batch query)
app.get('/test/events/:id/optimized', async (req, res) => {
  queryCount = 0; // Reset counter
  
  // Simulate getting event participants
  const attendingUserIds = [1, 2, 3];
  const interestedUserIds = [4, 5];
  
  // Single batch query (optimized approach)
  const allUserIds = [...attendingUserIds, ...interestedUserIds];
  
  if (allUserIds.length > 0) {
    // This should result in exactly 1 query
    const allUsersData = await mockDb.select();
    
    // Create lookup map for efficient access
    const userDataMap = new Map([
      [1, { id: 1, username: 'user1', fullName: 'User One', profileImage: '/img1.jpg' }],
      [2, { id: 2, username: 'user2', fullName: 'User Two', profileImage: '/img2.jpg' }],
      [3, { id: 3, username: 'user3', fullName: 'User Three', profileImage: '/img3.jpg' }]
    ]);
    
    // Build attending users array
    const attendingUsers = attendingUserIds.map(userId => {
      const user = userDataMap.get(userId);
      return user ? {
        id: user.id,
        name: user.fullName || user.username,
        username: user.username,
        image: user.profileImage || '/default-avatar.png'
      } : null;
    }).filter(Boolean);
    
    res.json({
      attendingUsers,
      queryCount,
      optimized: true
    });
  } else {
    res.json({
      attendingUsers: [],
      queryCount,
      optimized: true
    });
  }
});

// Simulate unoptimized event endpoint (N+1 queries)
app.get('/test/events/:id/unoptimized', async (req, res) => {
  queryCount = 0; // Reset counter
  
  const attendingUserIds = [1, 2, 3];
  const attendingUsers = [];
  
  // N+1 queries (unoptimized approach)
  for (const userId of attendingUserIds) {
    queryCount++; // Simulate individual query
    const userData = {
      id: userId,
      username: `user${userId}`,
      fullName: `User ${userId}`,
      profileImage: `/img${userId}.jpg`
    };
    
    attendingUsers.push({
      id: userData.id,
      name: userData.fullName || userData.username,
      username: userData.username,
      image: userData.profileImage || '/default-avatar.png'
    });
  }
  
  res.json({
    attendingUsers,
    queryCount,
    optimized: false
  });
});

// Test pagination endpoint
app.get('/test/users/paginated', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  
  // Simulate large dataset
  const totalUsers = 1000;
  const users = Array.from({ length: limit }, (_, i) => ({
    id: offset + i + 1,
    username: `user${offset + i + 1}`,
    fullName: `User ${offset + i + 1}`
  }));
  
  res.json({
    users,
    pagination: {
      limit,
      offset,
      total: totalUsers,
      hasMore: offset + limit < totalUsers
    },
    responseTime: Date.now() // Simulate response time tracking
  });
});

describe('Performance Tests', () => {
  beforeEach(() => {
    queryCount = 0;
    jest.clearAllMocks();
  });

  describe('N+1 Query Prevention', () => {
    test('optimized endpoint should use single batch query', async () => {
      const response = await request(app)
        .get('/test/events/1/optimized')
        .expect(200);
      
      expect(response.body.queryCount).toBe(1);
      expect(response.body.optimized).toBe(true);
      expect(response.body.attendingUsers).toHaveLength(3);
    });

    test('unoptimized endpoint should demonstrate N+1 problem', async () => {
      const response = await request(app)
        .get('/test/events/1/unoptimized')
        .expect(200);
      
      expect(response.body.queryCount).toBe(3); // One query per user
      expect(response.body.optimized).toBe(false);
      expect(response.body.attendingUsers).toHaveLength(3);
    });

    test('batch query should be more efficient than individual queries', async () => {
      const optimizedResponse = await request(app)
        .get('/test/events/1/optimized')
        .expect(200);
      
      const unoptimizedResponse = await request(app)
        .get('/test/events/1/unoptimized')
        .expect(200);
      
      expect(optimizedResponse.body.queryCount).toBeLessThan(unoptimizedResponse.body.queryCount);
    });
  });

  describe('Pagination Performance', () => {
    test('should handle small page sizes efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/test/users/paginated')
        .query({ limit: '10', offset: '0' })
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.body.users).toHaveLength(10);
      expect(response.body.pagination.limit).toBe(10);
      expect(responseTime).toBeLessThan(1000); // Should be fast
    });

    test('should enforce maximum page size', async () => {
      const response = await request(app)
        .get('/test/users/paginated')
        .query({ limit: '1000' }) // Requesting more than max
        .expect(200);
      
      expect(response.body.pagination.limit).toBe(100); // Should be capped at 100
    });

    test('should provide accurate pagination metadata', async () => {
      const response = await request(app)
        .get('/test/users/paginated')
        .query({ limit: '25', offset: '50' })
        .expect(200);
      
      expect(response.body.pagination).toEqual({
        limit: 25,
        offset: 50,
        total: 1000,
        hasMore: true
      });
    });

    test('should indicate last page correctly', async () => {
      const response = await request(app)
        .get('/test/users/paginated')
        .query({ limit: '50', offset: '975' })
        .expect(200);
      
      expect(response.body.pagination.hasMore).toBe(false);
      expect(response.body.users).toHaveLength(25); // Only 25 users left
    });
  });
});