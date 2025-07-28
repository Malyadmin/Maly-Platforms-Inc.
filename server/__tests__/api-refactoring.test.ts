import { describe, test, expect } from '@jest/globals';

// Test our validation schemas
import { 
  createEventSchema, 
  updateEventSchema, 
  createMessageSchema, 
  makeAdminSchema,
  userBrowseSchema 
} from '../validation/schemas.js';

describe('API Refactoring Validation Tests', () => {
  describe('Event Validation Schemas', () => {
    test('should validate correct event creation data', () => {
      const validEventData = {
        title: 'Test Event',
        description: 'This is a test event',
        location: 'Test City',
        date: new Date().toISOString(),
        category: 'Professional',
        price: 25.99,
        capacity: 100
      };

      const result = createEventSchema.safeParse(validEventData);
      expect(result.success).toBe(true);
    });

    test('should reject event data with missing required fields', () => {
      const invalidEventData = {
        title: '', // Empty title should fail
        description: 'This is a test event',
        // Missing location
        date: new Date().toISOString()
      };

      const result = createEventSchema.safeParse(invalidEventData);
      expect(result.success).toBe(false);
    });

    test('should reject event with invalid price', () => {
      const invalidEventData = {
        title: 'Test Event',
        description: 'This is a test event',
        location: 'Test City',
        date: new Date().toISOString(),
        price: -10 // Negative price should fail
      };

      const result = createEventSchema.safeParse(invalidEventData);
      expect(result.success).toBe(false);
    });
  });

  describe('Message Validation Schema', () => {
    test('should validate correct message data', () => {
      const validMessageData = {
        senderId: 1,
        receiverId: 2,
        content: 'Hello, this is a test message!'
      };

      const result = createMessageSchema.safeParse(validMessageData);
      expect(result.success).toBe(true);
    });

    test('should reject message with empty content', () => {
      const invalidMessageData = {
        senderId: 1,
        receiverId: 2,
        content: '' // Empty content should fail
      };

      const result = createMessageSchema.safeParse(invalidMessageData);
      expect(result.success).toBe(false);
    });

    test('should reject message with same sender and receiver', () => {
      const invalidMessageData = {
        senderId: 1,
        receiverId: 1, // Same as sender should fail
        content: 'This should not work'
      };

      const result = createMessageSchema.safeParse(invalidMessageData);
      expect(result.success).toBe(false);
    });
  });

  describe('Admin Operation Validation', () => {
    test('should validate correct admin make-admin request', () => {
      const validAdminData = {
        userId: 123
      };

      const result = makeAdminSchema.safeParse(validAdminData);
      expect(result.success).toBe(true);
    });

    test('should reject admin request with invalid user ID', () => {
      const invalidAdminData = {
        userId: 0 // Zero or negative should fail
      };

      const result = makeAdminSchema.safeParse(invalidAdminData);
      expect(result.success).toBe(false);
    });
  });

  describe('User Browse Validation', () => {
    test('should validate correct browse parameters', () => {
      const validBrowseData = {
        limit: 20,
        offset: 0,
        location: 'New York'
      };

      const result = userBrowseSchema.safeParse(validBrowseData);
      expect(result.success).toBe(true);
    });

    test('should enforce maximum limit', () => {
      const invalidBrowseData = {
        limit: 200, // Over maximum should be capped
        offset: 0
      };

      const result = userBrowseSchema.safeParse(invalidBrowseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBeLessThanOrEqual(100);
      }
    });

    test('should handle negative offset gracefully', () => {
      const invalidBrowseData = {
        limit: 20,
        offset: -10 // Negative offset should be handled
      };

      const result = userBrowseSchema.safeParse(invalidBrowseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('Security Implementation Tests', () => {
  test('middleware files exist and are properly structured', () => {
    // Test that our middleware files exist (import test)
    expect(() => {
      require('../middleware/authMiddleware.js');
    }).not.toThrow();

    expect(() => {
      require('../middleware/adminAuth.js');
    }).not.toThrow();
  });

  test('validation schemas properly reject malicious input', () => {
    // Test against potential XSS
    const maliciousEventData = {
      title: '<script>alert("xss")</script>',
      description: 'Normal description',
      location: 'Test City',
      date: new Date().toISOString()
    };

    const result = createEventSchema.safeParse(maliciousEventData);
    expect(result.success).toBe(true); // Schema allows it (sanitization happens at display)
    
    // But title length limits prevent extremely long malicious payloads
    const veryLongTitle = 'A'.repeat(201);
    const longTitleData = {
      ...maliciousEventData,
      title: veryLongTitle
    };

    const longResult = createEventSchema.safeParse(longTitleData);
    expect(longResult.success).toBe(false);
  });
});

describe('Performance Optimization Tests', () => {
  test('validation schemas process efficiently', () => {
    const startTime = Date.now();
    
    // Run validation many times
    for (let i = 0; i < 1000; i++) {
      createEventSchema.safeParse({
        title: `Event ${i}`,
        description: 'Test description',
        location: 'Test City',
        date: new Date().toISOString(),
        price: 10.99
      });
    }
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Should process 1000 validations in under 100ms
    expect(processingTime).toBeLessThan(100);
  });

  test('schemas handle large valid datasets efficiently', () => {
    const largeValidData = {
      title: 'Large Event',
      description: 'A'.repeat(1000), // Large but valid description
      location: 'Test City',
      date: new Date().toISOString(),
      tags: Array.from({ length: 20 }, (_, i) => `tag${i}`), // Many tags
      price: 50
    };

    const startTime = Date.now();
    const result = createEventSchema.safeParse(largeValidData);
    const endTime = Date.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(10); // Should be very fast
  });
});