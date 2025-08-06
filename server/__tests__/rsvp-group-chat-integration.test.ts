import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db } from '../../db';
import { users, events, eventParticipants, conversations, conversationParticipants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateEventGroupChat, addUserToConversation } from '../services/messagingService';

// This test verifies that RSVP approval creates group chats correctly
// It focuses on the database operations without testing the full HTTP layer

describe('RSVP Group Chat Integration', () => {
  let testEvent: any;
  let testHost: any;
  let attendee1: any;
  let attendee2: any;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(conversationParticipants);
    await db.delete(conversations);
    await db.delete(eventParticipants);
    await db.delete(events);
    await db.delete(users);

    // Create test users
    const [hostUser] = await db.insert(users).values({
      username: 'eventhost',
      email: 'host@test.com',
      password: '$2b$10$test.hash',
      fullName: 'Event Host'
    }).returning();

    const [user1] = await db.insert(users).values({
      username: 'attendee1',
      email: 'attendee1@test.com',
      password: '$2b$10$test.hash',
      fullName: 'First Attendee'
    }).returning();

    const [user2] = await db.insert(users).values({
      username: 'attendee2',
      email: 'attendee2@test.com',
      password: '$2b$10$test.hash',
      fullName: 'Second Attendee'
    }).returning();

    testHost = hostUser;
    attendee1 = user1;
    attendee2 = user2;

    // Create test event
    const [event] = await db.insert(events).values({
      title: 'RSVP Group Chat Test Event',
      description: 'Test event for RSVP group chat integration',
      city: 'Test City',
      location: 'Test Venue',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      category: 'Social',
      creatorId: testHost.id,
      capacity: 10,
      price: '0',
      ticketType: 'free',
      isPrivate: false
    }).returning();

    testEvent = event;
  });

  describe('Complete RSVP to Group Chat Flow', () => {
    test('should simulate complete RSVP approval flow with group chat creation', async () => {
      // Step 1: Create RSVP requests (simulating pending approvals)
      await db.insert(eventParticipants).values({
        eventId: testEvent.id,
        userId: attendee1.id,
        status: 'pending_approval',
        ticketQuantity: 1
      });

      await db.insert(eventParticipants).values({
        eventId: testEvent.id,
        userId: attendee2.id,
        status: 'pending_approval',
        ticketQuantity: 1
      });

      // Verify RSVPs are pending
      const pendingRSVPs = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.status, 'pending_approval')
        ));

      expect(pendingRSVPs).toHaveLength(2);

      // Step 2: Verify no group chat exists initially
      const initialConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));

      expect(initialConversations).toHaveLength(0);

      // Step 3: Simulate first RSVP approval (this should create group chat)
      // Update RSVP status to approved
      await db.update(eventParticipants)
        .set({ status: 'attending' })
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee1.id)
        ));

      // Create group chat and add approved user (simulating what happens in the API)
      const groupChat = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      await addUserToConversation(groupChat.id, attendee1.id);

      // Verify group chat was created
      expect(groupChat).toBeDefined();
      expect(groupChat.type).toBe('event');
      expect(groupChat.eventId).toBe(testEvent.id);
      expect(groupChat.title).toContain('RSVP Group Chat Test Event');

      // Verify participants (host + first attendee)
      const participantsAfterFirst = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, groupChat.id));

      expect(participantsAfterFirst).toHaveLength(2);
      const participantIds1 = participantsAfterFirst.map(p => p.userId);
      expect(participantIds1).toContain(testHost.id);
      expect(participantIds1).toContain(attendee1.id);
      expect(participantIds1).not.toContain(attendee2.id);

      // Step 4: Simulate second RSVP approval (should add to existing group chat)
      await db.update(eventParticipants)
        .set({ status: 'attending' })
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee2.id)
        ));

      // Get existing group chat (should be the same one) and add second user
      const existingGroupChat = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      await addUserToConversation(existingGroupChat.id, attendee2.id);

      // Verify same conversation was returned
      expect(existingGroupChat.id).toBe(groupChat.id);

      // Verify all participants are now in the group chat
      const participantsAfterSecond = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, groupChat.id));

      expect(participantsAfterSecond).toHaveLength(3);
      const participantIds2 = participantsAfterSecond.map(p => p.userId);
      expect(participantIds2).toContain(testHost.id);
      expect(participantIds2).toContain(attendee1.id);
      expect(participantIds2).toContain(attendee2.id);

      // Step 5: Verify only one conversation exists for this event
      const allEventConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));

      expect(allEventConversations).toHaveLength(1);
    });

    test('should handle rejection scenario - no group chat creation', async () => {
      // Create RSVP request
      await db.insert(eventParticipants).values({
        eventId: testEvent.id,
        userId: attendee1.id,
        status: 'pending_approval',
        ticketQuantity: 1
      });

      // Simulate rejection
      await db.update(eventParticipants)
        .set({ status: 'rejected' })
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee1.id)
        ));

      // Verify rejection was recorded
      const rejectedRSVP = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee1.id),
          eq(eventParticipants.status, 'rejected')
        ));

      expect(rejectedRSVP).toHaveLength(1);

      // Verify no group chat was created
      const rejectionConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.eventId, testEvent.id));

      expect(rejectionConversations).toHaveLength(0);

      // Verify no conversation participants exist
      const participants = await db.select()
        .from(conversationParticipants);

      expect(participants).toHaveLength(0);
    });

    test('should handle mixed approval/rejection scenario', async () => {
      // Create two RSVP requests
      await db.insert(eventParticipants).values([
        {
          eventId: testEvent.id,
          userId: attendee1.id,
          status: 'pending_approval',
          ticketQuantity: 1
        },
        {
          eventId: testEvent.id,
          userId: attendee2.id,
          status: 'pending_approval',
          ticketQuantity: 1
        }
      ]);

      // Approve first attendee
      await db.update(eventParticipants)
        .set({ status: 'attending' })
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee1.id)
        ));

      const groupChat = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      await addUserToConversation(groupChat.id, attendee1.id);

      // Reject second attendee
      await db.update(eventParticipants)
        .set({ status: 'rejected' })
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee2.id)
        ));

      // Verify group chat exists with only host and first attendee
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, groupChat.id));

      expect(participants).toHaveLength(2);
      const participantIds = participants.map(p => p.userId);
      expect(participantIds).toContain(testHost.id);
      expect(participantIds).toContain(attendee1.id);
      expect(participantIds).not.toContain(attendee2.id);

      // Verify RSVP statuses are correct
      const approvedRSVP = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee1.id)
        ));

      const rejectedRSVP = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, testEvent.id),
          eq(eventParticipants.userId, attendee2.id)
        ));

      expect(approvedRSVP[0].status).toBe('attending');
      expect(rejectedRSVP[0].status).toBe('rejected');
    });

    test('should maintain data consistency across multiple events', async () => {
      // Create a second event
      const [event2] = await db.insert(events).values({
        title: 'Second Test Event',
        description: 'Another test event',
        city: 'Test City',
        location: 'Test Venue 2',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        category: 'Social',
        creatorId: testHost.id,
        capacity: 10,
        price: '0',
        ticketType: 'free',
        isPrivate: false
      }).returning();

      // Create RSVPs for both events
      await db.insert(eventParticipants).values([
        {
          eventId: testEvent.id,
          userId: attendee1.id,
          status: 'pending_approval',
          ticketQuantity: 1
        },
        {
          eventId: event2.id,
          userId: attendee1.id,
          status: 'pending_approval',
          ticketQuantity: 1
        }
      ]);

      // Approve both RSVPs
      await db.update(eventParticipants)
        .set({ status: 'attending' })
        .where(eq(eventParticipants.userId, attendee1.id));

      // Create group chats for both events
      const groupChat1 = await getOrCreateEventGroupChat(testEvent.id, testHost.id);
      await addUserToConversation(groupChat1.id, attendee1.id);

      const groupChat2 = await getOrCreateEventGroupChat(event2.id, testHost.id);
      await addUserToConversation(groupChat2.id, attendee1.id);

      // Verify two separate group chats were created
      expect(groupChat1.id).not.toBe(groupChat2.id);
      expect(groupChat1.eventId).toBe(testEvent.id);
      expect(groupChat2.eventId).toBe(event2.id);

      // Verify each has the correct participants
      const participants1 = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, groupChat1.id));

      const participants2 = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, groupChat2.id));

      expect(participants1).toHaveLength(2); // Host + attendee1
      expect(participants2).toHaveLength(2); // Host + attendee1

      // Verify attendee1 is in both conversations
      const attendee1Conversations = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, attendee1.id));

      expect(attendee1Conversations).toHaveLength(2);
    });
  });
});