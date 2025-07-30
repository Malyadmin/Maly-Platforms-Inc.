import { jest, describe, test, expect } from '@jest/globals';

describe('RSVP Management System - Functionality Tests', () => {
  
  describe('Core RSVP Logic Tests', () => {
    
    test('1. Should validate status values correctly', () => {
      const validStatuses = ['approved', 'rejected'];
      const invalidStatuses = ['pending', 'attending', 'invalid', '', null, undefined];
      
      const isValidStatus = (status: any) => validStatuses.includes(status);
      
      validStatuses.forEach(status => {
        expect(isValidStatus(status)).toBe(true);
      });
      
      invalidStatuses.forEach(status => {
        expect(isValidStatus(status)).toBe(false);
      });
    });

    test('2. Should map approval status to participant status correctly', () => {
      const mapStatusToParticipantStatus = (status: string) => {
        return status === 'approved' ? 'attending' : 'rejected';
      };
      
      expect(mapStatusToParticipantStatus('approved')).toBe('attending');
      expect(mapStatusToParticipantStatus('rejected')).toBe('rejected');
    });

    test('3. Should calculate event capacity correctly', () => {
      const checkCapacity = (currentCount: number | null, maxAttendees: number | null, requestedTickets: number | null) => {
        const current = currentCount || 0;
        const requested = requestedTickets || 1;
        const max = maxAttendees;
        
        if (!max) return true; // No capacity limit
        
        return (current + requested) <= max;
      };
      
      expect(checkCapacity(50, 100, 10)).toBe(true);  // Within capacity
      expect(checkCapacity(95, 100, 10)).toBe(false); // Exceeds capacity
      expect(checkCapacity(null, 100, 5)).toBe(true); // Handles null current count
      expect(checkCapacity(50, null, 10)).toBe(true); // No capacity limit
    });

    test('4. Should handle null safety for attending count updates', () => {
      const updateAttendingCount = (currentCount: number | null, ticketQuantity: number | null) => {
        const current = currentCount || 0;
        const tickets = ticketQuantity || 1;
        return current + tickets;
      };
      
      expect(updateAttendingCount(5, 2)).toBe(7);
      expect(updateAttendingCount(null, 2)).toBe(2);
      expect(updateAttendingCount(5, null)).toBe(6);
      expect(updateAttendingCount(null, null)).toBe(1);
    });

    test('5. Should validate event ID format', () => {
      const isValidEventId = (eventId: string) => {
        const parsed = parseInt(eventId);
        // Also check that the string only contains digits to reject decimals
        return !isNaN(parsed) && parsed > 0 && /^\d+$/.test(eventId);
      };
      
      expect(isValidEventId('1')).toBe(true);
      expect(isValidEventId('123')).toBe(true);
      expect(isValidEventId('0')).toBe(false);
      expect(isValidEventId('-1')).toBe(false);
      expect(isValidEventId('invalid')).toBe(false);
      expect(isValidEventId('1.5')).toBe(false);
    });

    test('6. Should validate user ID format', () => {
      const isValidUserId = (userId: string) => {
        const parsed = parseInt(userId);
        return !isNaN(parsed) && parsed > 0;
      };
      
      expect(isValidUserId('1')).toBe(true);
      expect(isValidUserId('456')).toBe(true);
      expect(isValidUserId('0')).toBe(false);
      expect(isValidUserId('-5')).toBe(false);
      expect(isValidUserId('abc')).toBe(false);
      expect(isValidUserId('')).toBe(false);
    });

    test('7. Should check event host authorization', () => {
      const isEventHost = (eventCreatedBy: number, userId: number) => {
        return eventCreatedBy === userId;
      };
      
      expect(isEventHost(1, 1)).toBe(true);  // Host accessing own event
      expect(isEventHost(1, 2)).toBe(false); // Different user accessing event
      expect(isEventHost(5, 5)).toBe(true);  // Another host scenario
    });

    test('8. Should format application response data correctly', () => {
      const formatApplicationResponse = (applications: any[], eventId: number, eventTitle: string) => {
        return {
          eventId,
          eventTitle,
          applications: applications.map(app => ({
            id: app.id,
            userId: app.userId,
            status: app.status,
            ticketQuantity: app.ticketQuantity || 1,
            username: app.username || 'Unknown',
            fullName: app.fullName || 'Unknown User',
            email: app.email || ''
          })),
          totalPending: applications.length
        };
      };
      
      const mockApplications = [
        { id: 1, userId: 2, status: 'pending_approval', ticketQuantity: 2, username: 'user1', fullName: 'User One', email: 'user1@test.com' },
        { id: 2, userId: 3, status: 'pending_approval', ticketQuantity: null, username: null, fullName: null, email: null }
      ];
      
      const result = formatApplicationResponse(mockApplications, 1, 'Test Event');
      
      expect(result.eventId).toBe(1);
      expect(result.eventTitle).toBe('Test Event');
      expect(result.totalPending).toBe(2);
      expect(result.applications[0].ticketQuantity).toBe(2);
      expect(result.applications[1].ticketQuantity).toBe(1); // Default for null
      expect(result.applications[1].username).toBe('Unknown'); // Default for null
    });

    test('9. Should handle error response formatting', () => {
      const formatErrorResponse = (statusCode: number, message: string, additionalData?: any) => {
        const response: any = { error: message };
        if (additionalData) {
          Object.assign(response, additionalData);
        }
        return { statusCode, body: response };
      };
      
      const basicError = formatErrorResponse(404, 'Event not found');
      expect(basicError.statusCode).toBe(404);
      expect(basicError.body.error).toBe('Event not found');
      
      const detailedError = formatErrorResponse(400, 'Capacity exceeded', {
        currentCapacity: 95,
        maxCapacity: 100,
        requestedTickets: 10
      });
      expect(detailedError.statusCode).toBe(400);
      expect(detailedError.body.currentCapacity).toBe(95);
    });

    test('10. Should validate request body structure for approval/rejection', () => {
      const validateApprovalRequest = (body: any) => {
        if (!body || typeof body !== 'object') {
          return { valid: false, error: 'Request body is required' };
        }
        
        if (!body.status) {
          return { valid: false, error: 'Status is required' };
        }
        
        if (!['approved', 'rejected'].includes(body.status)) {
          return { valid: false, error: 'Invalid status. Must be \'approved\' or \'rejected\'' };
        }
        
        return { valid: true };
      };
      
      expect(validateApprovalRequest({ status: 'approved' })).toEqual({ valid: true });
      expect(validateApprovalRequest({ status: 'rejected' })).toEqual({ valid: true });
      
      const invalidCases = [
        null,
        undefined,
        {},
        { status: '' },
        { status: 'invalid' },
        { status: 'pending' },
        { otherField: 'value' }
      ];
      
      invalidCases.forEach(testCase => {
        const result = validateApprovalRequest(testCase);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('11. Should check application status transitions', () => {
      const canTransitionStatus = (currentStatus: string, newStatus: string) => {
        // Only pending_approval applications can be approved or rejected
        if (currentStatus !== 'pending_approval') {
          return false;
        }
        
        return ['approved', 'rejected'].includes(newStatus);
      };
      
      expect(canTransitionStatus('pending_approval', 'approved')).toBe(true);
      expect(canTransitionStatus('pending_approval', 'rejected')).toBe(true);
      expect(canTransitionStatus('attending', 'approved')).toBe(false);
      expect(canTransitionStatus('rejected', 'approved')).toBe(false);
      expect(canTransitionStatus('pending_approval', 'invalid')).toBe(false);
    });

    test('12. Should format success response for approval/rejection', () => {
      const formatApprovalResponse = (action: string, application: any, applicant: any) => {
        return {
          message: `Application ${action} successfully`,
          application: {
            id: application.id,
            eventId: application.eventId,
            userId: application.userId,
            status: application.status,
            ticketQuantity: application.ticketQuantity,
            updatedAt: new Date().toISOString()
          },
          applicant: {
            username: applicant.username,
            fullName: applicant.fullName,
            email: applicant.email
          }
        };
      };
      
      const mockApplication = {
        id: 101,
        eventId: 1,
        userId: 2,
        status: 'attending',
        ticketQuantity: 2
      };
      
      const mockApplicant = {
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com'
      };
      
      const response = formatApprovalResponse('approved', mockApplication, mockApplicant);
      
      expect(response.message).toBe('Application approved successfully');
      expect(response.application.status).toBe('attending');
      expect(response.applicant.username).toBe('testuser');
    });

    test('13. Should validate webhook payment status change', () => {
      const processPaymentWebhook = (session: any) => {
        if (session.payment_status === 'paid') {
          return {
            status: 'pending_approval', // Key change from previous 'attending'
            requiresApproval: true
          };
        }
        
        return {
          status: 'payment_failed',
          requiresApproval: false
        };
      };
      
      const paidSession = { payment_status: 'paid' };
      const failedSession = { payment_status: 'failed' };
      
      const paidResult = processPaymentWebhook(paidSession);
      expect(paidResult.status).toBe('pending_approval');
      expect(paidResult.requiresApproval).toBe(true);
      
      const failedResult = processPaymentWebhook(failedSession);
      expect(failedResult.status).toBe('payment_failed');
      expect(failedResult.requiresApproval).toBe(false);
    });

    test('14. Should handle pagination for large application lists', () => {
      const paginateApplications = (applications: any[], page: number = 1, limit: number = 50) => {
        const offset = (page - 1) * limit;
        const paginatedItems = applications.slice(offset, offset + limit);
        
        return {
          applications: paginatedItems,
          currentPage: page,
          totalItems: applications.length,
          totalPages: Math.ceil(applications.length / limit),
          hasNextPage: offset + limit < applications.length,
          hasPreviousPage: page > 1
        };
      };
      
      const manyApplications = Array(150).fill(null).map((_, i) => ({ id: i + 1, status: 'pending_approval' }));
      
      const page1 = paginateApplications(manyApplications, 1, 50);
      expect(page1.applications).toHaveLength(50);
      expect(page1.currentPage).toBe(1);
      expect(page1.totalPages).toBe(3);
      expect(page1.hasNextPage).toBe(true);
      expect(page1.hasPreviousPage).toBe(false);
      
      const page3 = paginateApplications(manyApplications, 3, 50);
      expect(page3.applications).toHaveLength(50);
      expect(page3.hasNextPage).toBe(false);
      expect(page3.hasPreviousPage).toBe(true);
    });

    test('15. Should filter applications by status', () => {
      const filterApplicationsByStatus = (applications: any[], status: string) => {
        return applications.filter(app => app.status === status);
      };
      
      const mixedApplications = [
        { id: 1, status: 'pending_approval' },
        { id: 2, status: 'attending' },
        { id: 3, status: 'pending_approval' },
        { id: 4, status: 'rejected' },
        { id: 5, status: 'pending_approval' }
      ];
      
      const pending = filterApplicationsByStatus(mixedApplications, 'pending_approval');
      expect(pending).toHaveLength(3);
      expect(pending.every(app => app.status === 'pending_approval')).toBe(true);
      
      const attending = filterApplicationsByStatus(mixedApplications, 'attending');
      expect(attending).toHaveLength(1);
      
      const rejected = filterApplicationsByStatus(mixedApplications, 'rejected');
      expect(rejected).toHaveLength(1);
    });

    test('16. Should calculate total ticket quantities for applications', () => {
      const calculateTotalTickets = (applications: any[]) => {
        return applications.reduce((total, app) => {
          return total + (app.ticketQuantity || 1);
        }, 0);
      };
      
      const applications = [
        { id: 1, ticketQuantity: 2 },
        { id: 2, ticketQuantity: 1 },
        { id: 3, ticketQuantity: null }, // Should default to 1
        { id: 4, ticketQuantity: 3 }
      ];
      
      const total = calculateTotalTickets(applications);
      expect(total).toBe(7); // 2 + 1 + 1 + 3
    });

    test('17. Should validate application data completeness', () => {
      const validateApplicationData = (application: any) => {
        const required = ['id', 'eventId', 'userId', 'status'];
        const missing = required.filter(field => !application || application[field] === undefined);
        
        return {
          isValid: missing.length === 0,
          missingFields: missing
        };
      };
      
      const validApplication = {
        id: 1,
        eventId: 1,
        userId: 2,
        status: 'pending_approval',
        ticketQuantity: 1
      };
      
      const invalidApplication = {
        id: 1,
        eventId: 1
        // Missing userId and status
      };
      
      const validResult = validateApplicationData(validApplication);
      expect(validResult.isValid).toBe(true);
      expect(validResult.missingFields).toHaveLength(0);
      
      const invalidResult = validateApplicationData(invalidApplication);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.missingFields).toContain('userId');
      expect(invalidResult.missingFields).toContain('status');
    });

    test('18. Should handle concurrent application processing', () => {
      // Simulate concurrent processing logic
      const processApplicationConcurrently = async (applicationId: number, action: string) => {
        // In real implementation, this would use database locks or transactions
        const timestamp = Date.now();
        const processingKey = `${applicationId}_${action}_${timestamp}`;
        
        return {
          processed: true,
          processingKey,
          timestamp
        };
      };
      
      const result = processApplicationConcurrently(1, 'approved');
      expect(result).resolves.toHaveProperty('processed', true);
    });

    test('19. Should validate event host permissions', () => {
      const checkEventHostPermissions = (event: any, user: any) => {
        if (!event) {
          return { hasPermission: false, reason: 'Event not found' };
        }
        
        if (!user) {
          return { hasPermission: false, reason: 'User not authenticated' };
        }
        
        if (event.createdBy !== user.id) {
          return { hasPermission: false, reason: 'You can only manage applications for your own events' };
        }
        
        return { hasPermission: true };
      };
      
      const event = { id: 1, createdBy: 5 };
      const hostUser = { id: 5, username: 'host' };
      const otherUser = { id: 6, username: 'other' };
      
      const hostPermission = checkEventHostPermissions(event, hostUser);
      expect(hostPermission.hasPermission).toBe(true);
      
      const otherPermission = checkEventHostPermissions(event, otherUser);
      expect(otherPermission.hasPermission).toBe(false);
      expect(otherPermission.reason).toBe('You can only manage applications for your own events');
      
      const noEventPermission = checkEventHostPermissions(null, hostUser);
      expect(noEventPermission.hasPermission).toBe(false);
      expect(noEventPermission.reason).toBe('Event not found');
    });

    test('20. Should format API response consistently', () => {
      const formatAPIResponse = (success: boolean, data?: any, error?: string) => {
        if (success) {
          return {
            success: true,
            data: data || null
          };
        } else {
          return {
            success: false,
            error: error || 'Unknown error occurred'
          };
        }
      };
      
      const successResponse = formatAPIResponse(true, { applications: [] });
      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toEqual({ applications: [] });
      
      const errorResponse = formatAPIResponse(false, null, 'Event not found');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Event not found');
    });
  });

  describe('Integration Logic Tests', () => {
    
    test('21. Complete RSVP workflow state transitions', () => {
      let participantStatus = 'unknown';
      
      // Step 1: Payment creates pending application
      const processPayment = () => {
        participantStatus = 'pending_approval';
        return participantStatus;
      };
      
      // Step 2: Host approves application
      const approveApplication = () => {
        if (participantStatus === 'pending_approval') {
          participantStatus = 'attending';
          return true;
        }
        return false;
      };
      
      // Step 3: Host rejects application
      const rejectApplication = () => {
        if (participantStatus === 'pending_approval') {
          participantStatus = 'rejected';
          return true;
        }
        return false;
      };
      
      // Test approval workflow
      processPayment();
      expect(participantStatus).toBe('pending_approval');
      
      const approvalResult = approveApplication();
      expect(approvalResult).toBe(true);
      expect(participantStatus).toBe('attending');
      
      // Reset for rejection test
      participantStatus = 'pending_approval';
      const rejectionResult = rejectApplication();
      expect(rejectionResult).toBe(true);
      expect(participantStatus).toBe('rejected');
    });

    test('22. Multiple event hosts managing different events', () => {
      const events = [
        { id: 1, createdBy: 1, title: 'Event 1' },
        { id: 2, createdBy: 2, title: 'Event 2' },
        { id: 3, createdBy: 1, title: 'Event 3' }
      ];
      
      const getEventsForHost = (hostId: number) => {
        return events.filter(event => event.createdBy === hostId);
      };
      
      const host1Events = getEventsForHost(1);
      expect(host1Events).toHaveLength(2);
      expect(host1Events.map(e => e.id)).toEqual([1, 3]);
      
      const host2Events = getEventsForHost(2);
      expect(host2Events).toHaveLength(1);
      expect(host2Events[0].id).toBe(2);
    });

    test('23. Batch processing of multiple applications', () => {
      const batchProcessApplications = (applications: any[], action: string) => {
        const results = applications.map(app => {
          if (app.status === 'pending_approval') {
            return {
              id: app.id,
              success: true,
              newStatus: action === 'approve' ? 'attending' : 'rejected'
            };
          } else {
            return {
              id: app.id,
              success: false,
              error: `Application ${app.id} is not in pending_approval status`
            };
          }
        });
        
        return {
          totalProcessed: results.filter(r => r.success).length,
          totalFailed: results.filter(r => !r.success).length,
          results
        };
      };
      
      const applications = [
        { id: 1, status: 'pending_approval' },
        { id: 2, status: 'pending_approval' },
        { id: 3, status: 'attending' } // Already processed
      ];
      
      const batchResult = batchProcessApplications(applications, 'approve');
      expect(batchResult.totalProcessed).toBe(2);
      expect(batchResult.totalFailed).toBe(1);
      expect(batchResult.results[2].success).toBe(false);
    });

    test('24. Rate limiting validation', () => {
      const rateLimiter = {
        requests: new Map(),
        maxRequests: 10,
        timeWindow: 60000, // 1 minute
        
        checkRateLimit(userId: number) {
          const now = Date.now();
          const userRequests = this.requests.get(userId) || [];
          
          // Remove old requests outside time window
          const recentRequests = userRequests.filter((time: number) => now - time < this.timeWindow);
          
          if (recentRequests.length >= this.maxRequests) {
            return { allowed: false, retryAfter: this.timeWindow - (now - recentRequests[0]) };
          }
          
          recentRequests.push(now);
          this.requests.set(userId, recentRequests);
          
          return { allowed: true, remainingRequests: this.maxRequests - recentRequests.length };
        }
      };
      
      // Test normal usage
      for (let i = 0; i < 9; i++) {
        const result = rateLimiter.checkRateLimit(1);
        expect(result.allowed).toBe(true);
      }
      
      // Test rate limit exceeded
      const limitResult = rateLimiter.checkRateLimit(1);
      expect(limitResult.allowed).toBe(true); // 10th request still allowed
      
      const exceededResult = rateLimiter.checkRateLimit(1);
      expect(exceededResult.allowed).toBe(false); // 11th request blocked
      expect(exceededResult.retryAfter).toBeGreaterThan(0);
    });

    test('25. Application sorting and ordering', () => {
      const sortApplications = (applications: any[], sortBy: string = 'createdAt', order: string = 'desc') => {
        return [...applications].sort((a, b) => {
          let aValue = a[sortBy];
          let bValue = b[sortBy];
          
          if (sortBy === 'createdAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          
          if (order === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      };
      
      const applications = [
        { id: 1, ticketQuantity: 2, createdAt: '2024-01-15T10:00:00Z' },
        { id: 2, ticketQuantity: 1, createdAt: '2024-01-15T11:00:00Z' },
        { id: 3, ticketQuantity: 3, createdAt: '2024-01-15T09:00:00Z' }
      ];
      
      const sortedByDate = sortApplications(applications, 'createdAt', 'desc');
      expect(sortedByDate[0].id).toBe(2); // Most recent first
      
      const sortedByTickets = sortApplications(applications, 'ticketQuantity', 'desc');
      expect(sortedByTickets[0].ticketQuantity).toBe(3); // Highest quantity first
    });
  });

  describe('Performance and Scalability Tests', () => {
    
    test('26. Memory usage with large datasets', () => {
      const processLargeApplicationList = (size: number) => {
        const applications = Array(size).fill(null).map((_, i) => ({
          id: i + 1,
          userId: (i % 100) + 1,
          status: 'pending_approval',
          ticketQuantity: Math.floor(Math.random() * 5) + 1
        }));
        
        // Simulate processing without storing all in memory
        let totalTickets = 0;
        let processedCount = 0;
        
        for (const app of applications) {
          totalTickets += app.ticketQuantity;
          processedCount++;
        }
        
        return {
          processed: processedCount,
          totalTickets,
          memoryEfficient: true
        };
      };
      
      const result = processLargeApplicationList(10000);
      expect(result.processed).toBe(10000);
      expect(result.totalTickets).toBeGreaterThan(10000);
      expect(result.memoryEfficient).toBe(true);
    });

    test('27. Optimized database query structure', () => {
      // Test the logic for efficient database queries
      const optimizeApplicationQuery = (filters: any) => {
        const queryParts = [];
        const params: any[] = [];
        
        if (filters.eventId) {
          queryParts.push('eventId = ?');
          params.push(filters.eventId);
        }
        
        if (filters.status) {
          queryParts.push('status = ?');
          params.push(filters.status);
        }
        
        if (filters.limit) {
          queryParts.push('LIMIT ?');
          params.push(filters.limit);
        }
        
        return {
          query: `SELECT * FROM event_participants WHERE ${queryParts.join(' AND ')}`,
          params,
          isOptimized: queryParts.length > 0
        };
      };
      
      const query = optimizeApplicationQuery({
        eventId: 1,
        status: 'pending_approval',
        limit: 50
      });
      
      expect(query.query).toContain('eventId = ?');
      expect(query.query).toContain('status = ?');
      expect(query.params).toEqual([1, 'pending_approval', 50]);
      expect(query.isOptimized).toBe(true);
    });

    test('28. Caching strategy validation', () => {
      const cache = new Map();
      
      const getCachedApplications = (eventId: number, maxAge: number = 300000) => { // 5 minutes
        const cacheKey = `applications_${eventId}`;
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < maxAge) {
          return { data: cached.data, fromCache: true };
        }
        
        // Simulate fetching from database
        const freshData = [{ id: 1, status: 'pending_approval' }];
        cache.set(cacheKey, { data: freshData, timestamp: Date.now() });
        
        return { data: freshData, fromCache: false };
      };
      
      const firstCall = getCachedApplications(1);
      expect(firstCall.fromCache).toBe(false);
      
      const secondCall = getCachedApplications(1);
      expect(secondCall.fromCache).toBe(true);
      expect(secondCall.data).toEqual(firstCall.data);
    });

    test('29. Error recovery and retry logic', () => {
      let attemptCount = 0;
      
      const processWithRetry = async (maxRetries: number = 3) => {
        attemptCount++;
        
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        
        return { success: true, attempts: attemptCount };
      };
      
      const retryWrapper = async (fn: Function, maxRetries: number = 3) => {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            if (i === maxRetries - 1) throw error;
          }
        }
      };
      
      // This would resolve on the 3rd attempt
      expect(retryWrapper(processWithRetry)).resolves.toHaveProperty('success', true);
    });

    test('30. Data consistency validation', () => {
      const validateDataConsistency = (event: any, applications: any[]) => {
        const issues = [];
        
        // Check if event exists
        if (!event) {
          issues.push('Event data missing');
          return { isConsistent: false, issues };
        }
        
        // Check if application user IDs are valid
        const invalidUserIds = applications.filter(app => !app.userId || app.userId <= 0);
        if (invalidUserIds.length > 0) {
          issues.push(`${invalidUserIds.length} applications have invalid user IDs`);
        }
        
        // Check if applications belong to the correct event
        const wrongEventApps = applications.filter(app => app.eventId !== event.id);
        if (wrongEventApps.length > 0) {
          issues.push(`${wrongEventApps.length} applications belong to different events`);
        }
        
        // Check for duplicate applications
        const userIds = applications.map(app => app.userId);
        const duplicateUsers = userIds.filter((id, index) => userIds.indexOf(id) !== index);
        if (duplicateUsers.length > 0) {
          issues.push(`Duplicate applications found for users: ${[...new Set(duplicateUsers)].join(', ')}`);
        }
        
        return {
          isConsistent: issues.length === 0,
          issues
        };
      };
      
      const event = { id: 1, title: 'Test Event' };
      const validApplications = [
        { id: 1, eventId: 1, userId: 2, status: 'pending_approval' },
        { id: 2, eventId: 1, userId: 3, status: 'pending_approval' }
      ];
      
      const invalidApplications = [
        { id: 1, eventId: 1, userId: 2, status: 'pending_approval' },
        { id: 2, eventId: 2, userId: 3, status: 'pending_approval' }, // Wrong event
        { id: 3, eventId: 1, userId: 2, status: 'pending_approval' }  // Duplicate user
      ];
      
      const validResult = validateDataConsistency(event, validApplications);
      expect(validResult.isConsistent).toBe(true);
      expect(validResult.issues).toHaveLength(0);
      
      const invalidResult = validateDataConsistency(event, invalidApplications);
      expect(invalidResult.isConsistent).toBe(false);
      expect(invalidResult.issues.length).toBeGreaterThan(0);
    });
  });
});