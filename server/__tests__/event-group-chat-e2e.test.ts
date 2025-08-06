import { describe, test, expect, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { db } from '../../db';
import { users, events, eventParticipants, conversations, conversationParticipants, messages } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createApp } from '../app';

describe('Event Group Chat E2E Flow', () => {
  let app: any;
  let server: any;
  let eventHost: any;
  let attendee1: any;
  let attendee2: any;
  let testEvent: any;
  let hostAuthCookie: string;
  let attendee1AuthCookie: string;
  let attendee2AuthCookie: string;

  beforeAll(async () => {
    // Create the server instance
    const serverInstance = await createApp();
    app = serverInstance.app;
    server = serverInstance.httpServer;
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up all test data
    await db.delete(messages);
    await db.delete(conversationParticipants);
    await db.delete(conversations);
    await db.delete(eventParticipants);
    await db.delete(events);
    await db.delete(users);

    // Create test users
    const [hostUser] = await db.insert(users).values({
      username: 'eventhost',
      email: 'host@test.com',
      password: '$2b$10$test.hash.for.password123',
      fullName: 'Event Host'
    }).returning();

    const [attendeeUser1] = await db.insert(users).values({
      username: 'attendee1',
      email: 'attendee1@test.com',
      password: '$2b$10$test.hash.for.password123',
      fullName: 'First Attendee'
    }).returning();

    const [attendeeUser2] = await db.insert(users).values({
      username: 'attendee2',
      email: 'attendee2@test.com',
      password: '$2b$10$test.hash.for.password123',
      fullName: 'Second Attendee'
    }).returning();

    eventHost = hostUser;
    attendee1 = attendeeUser1;
    attendee2 = attendeeUser2;

    // Login users and get auth cookies
    const hostLogin = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'eventhost',
        password: 'password123'
      });
    
    const attendee1Login = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'attendee1',
        password: 'password123'
      });

    const attendee2Login = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'attendee2',
        password: 'password123'
      });

    hostAuthCookie = hostLogin.headers['set-cookie'];
    attendee1AuthCookie = attendee1Login.headers['set-cookie'];
    attendee2AuthCookie = attendee2Login.headers['set-cookie'];

    // Create a test event
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Cookie', hostAuthCookie)
      .send({
        title: 'Test Group Chat Event',
        description: 'An event to test group chat functionality',
        city: 'Test City',
        location: 'Test Venue',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        category: 'Social',
        capacity: 10,
        price: '0',
        ticketType: 'free',
        isPrivate: false
      });

    expect(eventResponse.status).toBe(201);
    testEvent = eventResponse.body;
  });

  describe('Complete RSVP to Group Chat Flow', () => {
    test('should handle complete flow: RSVP request → approval → group chat creation → messaging', async () => {
      // Step 1: Attendee 1 sends RSVP request
      const rsvpResponse1 = await request(app)
        .post(`/api/events/${testEvent.id}/participate`)
        .set('Cookie', attendee1AuthCookie)
        .send({
          status: 'pending_approval',
          ticketQuantity: 1
        });

      expect(rsvpResponse1.status).toBe(200);
      expect(rsvpResponse1.body.message).toContain('RSVP request submitted');

      // Step 2: Attendee 2 sends RSVP request
      const rsvpResponse2 = await request(app)
        .post(`/api/events/${testEvent.id}/participate`)
        .set('Cookie', attendee2AuthCookie)
        .send({
          status: 'pending_approval',
          ticketQuantity: 1
        });

      expect(rsvpResponse2.status).toBe(200);
      expect(rsvpResponse2.body.message).toContain('RSVP request submitted');

      // Step 3: Verify no group chat exists yet
      const initialConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));
      
      expect(initialConversations).toHaveLength(0);

      // Step 4: Host approves first attendee
      const approvalResponse1 = await request(app)
        .put(`/api/events/${testEvent.id}/applications/${attendee1.id}`)
        .set('Cookie', hostAuthCookie)
        .send({
          status: 'approved'
        });

      expect(approvalResponse1.status).toBe(200);
      expect(approvalResponse1.body.message).toContain('approved successfully');

      // Step 5: Verify group chat is created and host + first attendee are added
      const conversationsAfterFirst = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));
      
      expect(conversationsAfterFirst).toHaveLength(1);
      
      const conversation = conversationsAfterFirst[0];
      expect(conversation.type).toBe('event');
      expect(conversation.title).toContain('Test Group Chat Event');
      expect(conversation.eventId).toBe(testEvent.id);
      expect(conversation.createdBy).toBe(eventHost.id);

      // Verify participants in the conversation
      const participantsAfterFirst = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id));
      
      expect(participantsAfterFirst).toHaveLength(2); // Host + first attendee
      
      const participantIds = participantsAfterFirst.map(p => p.userId);
      expect(participantIds).toContain(eventHost.id);
      expect(participantIds).toContain(attendee1.id);
      expect(participantIds).not.toContain(attendee2.id);

      // Step 6: Host approves second attendee
      const approvalResponse2 = await request(app)
        .put(`/api/events/${testEvent.id}/applications/${attendee2.id}`)
        .set('Cookie', hostAuthCookie)
        .send({
          status: 'approved'
        });

      expect(approvalResponse2.status).toBe(200);
      expect(approvalResponse2.body.message).toContain('approved successfully');

      // Step 7: Verify second attendee is added to existing group chat (not creating new one)
      const conversationsAfterSecond = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));
      
      expect(conversationsAfterSecond).toHaveLength(1); // Still only one conversation
      
      const participantsAfterSecond = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id));
      
      expect(participantsAfterSecond).toHaveLength(3); // Host + both attendees
      
      const allParticipantIds = participantsAfterSecond.map(p => p.userId);
      expect(allParticipantIds).toContain(eventHost.id);
      expect(allParticipantIds).toContain(attendee1.id);
      expect(allParticipantIds).toContain(attendee2.id);

      // Step 8: Test messaging in the group chat
      // Host sends a welcome message
      const hostMessageResponse = await request(app)
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', hostAuthCookie)
        .send({
          content: 'Welcome to the event group chat everyone! 🎉'
        });

      expect(hostMessageResponse.status).toBe(200);
      expect(hostMessageResponse.body[0].content).toBe('Welcome to the event group chat everyone! 🎉');
      expect(hostMessageResponse.body[0].sender.id).toBe(eventHost.id);

      // First attendee responds
      const attendee1MessageResponse = await request(app)
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', attendee1AuthCookie)
        .send({
          content: 'Thanks! Excited for the event!'
        });

      expect(attendee1MessageResponse.status).toBe(200);
      expect(attendee1MessageResponse.body[0].content).toBe('Thanks! Excited for the event!');
      expect(attendee1MessageResponse.body[0].sender.id).toBe(attendee1.id);

      // Second attendee responds
      const attendee2MessageResponse = await request(app)
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', attendee2AuthCookie)
        .send({
          content: 'Looking forward to meeting everyone!'
        });

      expect(attendee2MessageResponse.status).toBe(200);
      expect(attendee2MessageResponse.body[0].content).toBe('Looking forward to meeting everyone!');
      expect(attendee2MessageResponse.body[0].sender.id).toBe(attendee2.id);

      // Step 9: Verify all participants can retrieve group chat messages
      const hostMessagesResponse = await request(app)
        .get(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', hostAuthCookie);

      expect(hostMessagesResponse.status).toBe(200);
      expect(hostMessagesResponse.body).toHaveLength(3);
      
      const messages = hostMessagesResponse.body;
      expect(messages[0].content).toBe('Welcome to the event group chat everyone! 🎉');
      expect(messages[1].content).toBe('Thanks! Excited for the event!');
      expect(messages[2].content).toBe('Looking forward to meeting everyone!');

      // Verify attendees can also retrieve messages
      const attendee1MessagesResponse = await request(app)
        .get(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', attendee1AuthCookie);

      expect(attendee1MessagesResponse.status).toBe(200);
      expect(attendee1MessagesResponse.body).toHaveLength(3);

      const attendee2MessagesResponse = await request(app)
        .get(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', attendee2AuthCookie);

      expect(attendee2MessagesResponse.status).toBe(200);
      expect(attendee2MessagesResponse.body).toHaveLength(3);

      // Step 10: Verify group chat appears in inbox for all participants
      const hostInboxResponse = await request(app)
        .get(`/api/conversations/${eventHost.id}`)
        .set('Cookie', hostAuthCookie);

      expect(hostInboxResponse.status).toBe(200);
      expect(hostInboxResponse.body).toHaveLength(1);
      
      const hostConversation = hostInboxResponse.body[0];
      expect(hostConversation.type).toBe('event');
      expect(hostConversation.title).toContain('Test Group Chat Event');
      expect(hostConversation.eventId).toBe(testEvent.id);
      expect(hostConversation.participantCount).toBe(3);
      expect(hostConversation.lastMessage.content).toBe('Looking forward to meeting everyone!');

      // Step 11: Test that non-participants cannot access the group chat
      // Create another user who is not approved
      const [outsiderUser] = await db.insert(users).values({
        username: 'outsider',
        email: 'outsider@test.com',
        password: '$2b$10$test.hash.for.password123',
        fullName: 'Outsider User'
      }).returning();

      const outsiderLogin = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'outsider',
          password: 'password123'
        });

      const outsiderAuthCookie = outsiderLogin.headers['set-cookie'];

      // Outsider tries to send message - should fail
      const outsiderMessageResponse = await request(app)
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', outsiderAuthCookie)
        .send({
          content: 'I should not be able to send this!'
        });

      expect(outsiderMessageResponse.status).toBe(403);
      expect(outsiderMessageResponse.body.error).toContain('not a participant');

      // Outsider tries to read messages - should fail
      const outsiderReadResponse = await request(app)
        .get(`/api/conversations/${conversation.id}/messages`)
        .set('Cookie', outsiderAuthCookie);

      expect(outsiderReadResponse.status).toBe(403);
      expect(outsiderReadResponse.body.error).toContain('not a participant');
    });

    test('should handle rejection scenario correctly', async () => {
      // Step 1: Attendee sends RSVP request
      const rsvpResponse = await request(app)
        .post(`/api/events/${testEvent.id}/participate`)
        .set('Cookie', attendee1AuthCookie)
        .send({
          status: 'pending_approval',
          ticketQuantity: 1
        });

      expect(rsvpResponse.status).toBe(200);

      // Step 2: Host rejects the application
      const rejectionResponse = await request(app)
        .put(`/api/events/${testEvent.id}/applications/${attendee1.id}`)
        .set('Cookie', hostAuthCookie)
        .send({
          status: 'rejected'
        });

      expect(rejectionResponse.status).toBe(200);
      expect(rejectionResponse.body.message).toContain('rejected successfully');

      // Step 3: Verify no group chat was created
      const rejectionConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));
      
      expect(rejectionConversations).toHaveLength(0);

      // Step 4: Verify no conversation participants exist
      const participants = await db.select()
        .from(conversationParticipants);
      
      expect(participants).toHaveLength(0);
    });

    test('should prevent duplicate group chat creation for same event', async () => {
      // Create two RSVP requests
      await request(app)
        .post(`/api/events/${testEvent.id}/participate`)
        .set('Cookie', attendee1AuthCookie)
        .send({ status: 'pending_approval', ticketQuantity: 1 });

      await request(app)
        .post(`/api/events/${testEvent.id}/participate`)
        .set('Cookie', attendee2AuthCookie)
        .send({ status: 'pending_approval', ticketQuantity: 1 });

      // Approve both attendees
      await request(app)
        .put(`/api/events/${testEvent.id}/applications/${attendee1.id}`)
        .set('Cookie', hostAuthCookie)
        .send({ status: 'approved' });

      await request(app)
        .put(`/api/events/${testEvent.id}/applications/${attendee2.id}`)
        .set('Cookie', hostAuthCookie)
        .send({ status: 'approved' });

      // Verify only one conversation exists for the event
      const eventConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));
      
      expect(eventConversations).toHaveLength(1);

      // Verify all participants are in the same conversation
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, eventConversations[0].id));
      
      expect(participants).toHaveLength(3); // Host + 2 attendees
    });
  });
});