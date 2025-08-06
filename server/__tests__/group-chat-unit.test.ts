import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db } from '../../db';
import { users, events, eventParticipants, conversations, conversationParticipants, messages } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateEventGroupChat, addUserToConversation } from '../services/messagingService';

describe('Group Chat Unit Tests', () => {
  let testEvent: any;
  let testUser1: any;
  let testUser2: any;
  let testHost: any;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(messages);
    await db.delete(conversationParticipants);
    await db.delete(conversations);
    await db.delete(eventParticipants);
    await db.delete(events);
    await db.delete(users);

    // Create test users
    const [hostUser] = await db.insert(users).values({
      username: 'testhost',
      email: 'host@test.com',
      password: '$2b$10$test.hash',
      fullName: 'Test Host'
    }).returning();

    const [user1] = await db.insert(users).values({
      username: 'user1',
      email: 'user1@test.com',
      password: '$2b$10$test.hash',
      fullName: 'User One'
    }).returning();

    const [user2] = await db.insert(users).values({
      username: 'user2',
      email: 'user2@test.com',
      password: '$2b$10$test.hash',
      fullName: 'User Two'
    }).returning();

    testHost = hostUser;
    testUser1 = user1;
    testUser2 = user2;

    // Create test event
    const [event] = await db.insert(events).values({
      title: 'Test Group Chat Event',
      description: 'Test event for group chat',
      city: 'Test City',
      location: 'Test Venue',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      category: 'Social',
      creatorId: testHost.id,
      capacity: 10,
      price: '0',
      ticketType: 'free',
      isPrivate: false
    }).returning();

    testEvent = event;
  });

  describe('getOrCreateEventGroupChat', () => {
    test('should create a new group chat when none exists', async () => {
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      expect(conversation).toBeDefined();
      expect(conversation.type).toBe('event');
      expect(conversation.eventId).toBe(testEvent.id);
      expect(conversation.createdBy).toBe(testHost.id);
      expect(conversation.title).toContain('Test Group Chat Event');
    });

    test('should return existing group chat when one already exists', async () => {
      // Create first conversation
      const conversation1 = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      // Try to create again - should return the same one
      const conversation2 = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      expect(conversation1.id).toBe(conversation2.id);
      
      // Verify only one conversation exists for this event
      const allConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));
      
      expect(allConversations).toHaveLength(1);
    });

    test('should automatically add event host as participant', async () => {
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id));
      
      expect(participants).toHaveLength(1);
      expect(participants[0].userId).toBe(testHost.id);
    });
  });

  describe('addUserToConversation', () => {
    test('should add new user to existing conversation', async () => {
      // Create conversation with host
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      // Add user1 to conversation
      await addUserToConversation(conversation.id, testUser1.id);
      
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id));
      
      expect(participants).toHaveLength(2);
      const participantIds = participants.map(p => p.userId);
      expect(participantIds).toContain(testHost.id);
      expect(participantIds).toContain(testUser1.id);
    });

    test('should not add duplicate participants', async () => {
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      // Add user1 twice
      await addUserToConversation(conversation.id, testUser1.id);
      await addUserToConversation(conversation.id, testUser1.id);
      
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id));
      
      expect(participants).toHaveLength(2); // Host + user1 (no duplicates)
    });

    test('should allow multiple users in same conversation', async () => {
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      // Add multiple users
      await addUserToConversation(conversation.id, testUser1.id);
      await addUserToConversation(conversation.id, testUser2.id);
      
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id));
      
      expect(participants).toHaveLength(3); // Host + user1 + user2
      const participantIds = participants.map(p => p.userId);
      expect(participantIds).toContain(testHost.id);
      expect(participantIds).toContain(testUser1.id);
      expect(participantIds).toContain(testUser2.id);
    });
  });

  describe('Database Integration', () => {
    test('should maintain proper foreign key relationships', async () => {
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      await addUserToConversation(conversation.id, testUser1.id);
      
      // Verify conversation references event correctly
      const conversationRecord = await db.select()
        .from(conversations)
        .where(eq(conversations.id, conversation.id));
      
      expect(conversationRecord[0].eventId).toBe(testEvent.id);
      expect(conversationRecord[0].createdBy).toBe(testHost.id);
      
      // Verify participants reference conversation correctly
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id));
      
      expect(participants).toHaveLength(2);
      participants.forEach(participant => {
        expect(participant.conversationId).toBe(conversation.id);
        expect([testHost.id, testUser1.id]).toContain(participant.userId);
      });
    });

    test('should handle conversation title generation correctly', async () => {
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      expect(conversation.title).toContain('Test Group Chat Event');
      expect(conversation.title).toContain('Group Chat');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid event ID gracefully', async () => {
      await expect(getOrCreateEventGroupChat(99999, testHost.id))
        .rejects
        .toThrow();
    });

    test('should handle invalid user ID in addUserToConversation', async () => {
      const conversation = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      
      await expect(addUserToConversation(conversation.id, 99999))
        .rejects
        .toThrow();
    });

    test('should handle invalid conversation ID in addUserToConversation', async () => {
      await expect(addUserToConversation(99999, testUser1.id))
        .rejects
        .toThrow();
    });
  });
});