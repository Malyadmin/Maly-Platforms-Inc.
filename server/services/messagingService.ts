import { db } from "../../db";
import { 
  messages, 
  users, 
  userConnections,
  conversations,
  conversationParticipants,
  events,
  Message, 
  NewMessage,
  Conversation,
  NewConversation,
  ConversationParticipant,
  NewConversationParticipant
} from "../../db/schema";
import { eq, and, or, desc, asc, ne, isNull } from "drizzle-orm";

// Extended conversation type that matches iOS Conversation model exactly
interface ExtendedConversation {
  id: number;
  type: string;
  title: string; // Always non-null for iOS compatibility
  last_message?: {
    id: number;
    content: string;
    createdAt: Date;
    senderId: number;
    sender?: {
      id: number;
      username?: string;
      fullName?: string;
      profileImage?: string;
    };
  } | null;
  unreadCount: number;
  event_id?: number | null;
  participant_count?: number;
  createdAt: Date;
  // Removed createdBy - not in iOS model
}

// Send a message (only between connected users)
export async function sendMessage({ senderId, receiverId, content }: {
  senderId: number;
  receiverId: number;
  content: string;
}) {
  // Check if users are connected
  const connectionExists = await db.query.userConnections.findFirst({
    where: or(
      and(
        eq(userConnections.followerId, senderId),
        eq(userConnections.followingId, receiverId),
        eq(userConnections.status, "accepted")
      ),
      and(
        eq(userConnections.followerId, receiverId),
        eq(userConnections.followingId, senderId),
        eq(userConnections.status, "accepted")
      )
    )
  });

  // For now, we're going to log and allow messages even if users aren't connected
  if (!connectionExists) {
    console.log(`WARNING: Sending message between non-connected users ${senderId} and ${receiverId}`);
    // Instead of throwing an error, we'll just continue
    // throw new Error("Users must be connected to send messages");
  }

  // Create the message
  const newMessage: NewMessage = {
    senderId,
    receiverId,
    content,
    createdAt: new Date(),
    isRead: false
  };

  const result = await db.insert(messages).values(newMessage).returning();

  // Get sender info for notification purposes
  const sender = await db.query.users.findFirst({
    where: eq(users.id, senderId),
    columns: {
      id: true,
      fullName: true,
      profileImage: true
    }
  });

  // Return the message with sender info formatted for iOS
  if (result.length > 0 && sender) {
    const message = result[0];
    return {
      id: message.id,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      conversation_id: message.conversationId,
      content: message.content,
      createdAt: message.createdAt,
      is_read: message.isRead,
      sender: {
        id: sender.id,
        fullName: sender.fullName,
        profileImage: sender.profileImage
      },
      receiver: null // Will be populated if needed for direct messages
    };
  }

  // Fallback if no sender found
  if (result.length > 0) {
    const message = result[0];
    return {
      id: message.id,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      conversation_id: message.conversationId,
      content: message.content,
      createdAt: message.createdAt,
      is_read: message.isRead,
      sender: null,
      receiver: null
    };
  }

  throw new Error("Failed to create message");
}

// Get conversations for a user (now supports both direct and group chats)
export async function getConversations(userId: number) {
  // Get all conversations that the user is a participant in
  const userConversations = await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.userId, userId),
    with: {
      conversation: {
        with: {
          event: {
            columns: {
              id: true,
              title: true
            }
          },
          creator: {
            columns: {
              id: true,
              fullName: true,
              username: true,
              profileImage: true
            }
          }
        }
      }
    }
  });

  const conversationResults = [];

  for (const userConv of userConversations) {
    const conversation = userConv.conversation;
    
    // Skip if conversation is null
    if (!conversation) continue;
    
    // Get the latest message for this conversation
    const latestMessage = await db.query.messages.findFirst({
      where: eq(messages.conversationId, conversation.id),
      orderBy: [desc(messages.createdAt)],
      with: {
        sender: {
          columns: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true
          }
        }
      }
    });

    let conversationInfo; // Declare conversationInfo here

    // For conversations with no messages, create empty conversation info
    // This is important for newly created direct conversations to appear in the inbox
    if (!latestMessage) {
      if (conversation.type === 'event') {
        conversationInfo = {
          id: conversation.id,
          type: 'event',
          title: conversation.title || (conversation.event?.title ? `${conversation.event.title} - Event Chat` : 'Event Chat'),
          eventId: conversation.eventId,
          lastMessage: null,
          unreadCount: 0,
          participantCount: await getConversationParticipantCount(conversation.id),
          createdAt: conversation.createdAt
        };
      } else {
        // For direct conversations, we need to find the other participant
        const otherParticipants = await db.query.conversationParticipants.findMany({
          where: and(
            eq(conversationParticipants.conversationId, conversation.id),
            ne(conversationParticipants.userId, userId)
          ),
          with: {
            user: {
              columns: {
                id: true,
                fullName: true,
                username: true,
                profileImage: true
              }
            }
          }
        });

        const otherUser = otherParticipants[0]?.user;
        if (!otherUser) continue;

        conversationInfo = {
          id: conversation.id,
          type: 'direct',
          title: otherUser.fullName || otherUser.username,
          lastMessage: null,
          unreadCount: 0,
          eventId: conversation.eventId,
          participantCount: 2,
          createdAt: conversation.createdAt
        };
      }
      
      conversationResults.push(conversationInfo);
      continue;
    }

    // Calculate unread count
    const unreadMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.conversationId, conversation.id),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      )
    });

    // Format the latest message to match iOS Message model expectations
    const formattedLastMessage = latestMessage ? {
      id: latestMessage.id,
      sender_id: latestMessage.senderId,
      receiver_id: latestMessage.receiverId,
      conversation_id: latestMessage.conversationId,
      content: latestMessage.content,
      createdAt: latestMessage.createdAt,
      is_read: latestMessage.isRead,
      sender: latestMessage.sender ? {
        id: latestMessage.sender.id,
        username: latestMessage.sender.username,
        fullName: latestMessage.sender.fullName,
        profileImage: latestMessage.sender.profileImage
      } : null,
      receiver: null // Usually null for conversation messages
    } : null;

    if (conversation.type === 'event') {
      // For event conversations, use event title and show it's a group chat
      conversationInfo = {
        id: conversation.id,
        type: 'event',
        title: conversation.title || (conversation.event?.title ? `${conversation.event.title} - Event Chat` : 'Event Chat'),
        eventId: conversation.eventId,
        lastMessage: formattedLastMessage,
        unreadCount: unreadMessages.length,
        participantCount: await getConversationParticipantCount(conversation.id),
        createdAt: conversation.createdAt
      };
    } else {
      // For direct conversations, we need to find the other participant
      const otherParticipants = await db.query.conversationParticipants.findMany({
        where: and(
          eq(conversationParticipants.conversationId, conversation.id),
          ne(conversationParticipants.userId, userId)
        ),
        with: {
          user: {
            columns: {
              id: true,
              fullName: true,
              username: true,
              profileImage: true
            }
          }
        }
      });

      // For direct chats, use the other user's info as title
      const otherUser = otherParticipants[0]?.user;
      if (!otherUser) continue;

      conversationInfo = {
        id: conversation.id,
        type: 'direct',
        title: otherUser.fullName || otherUser.username,
        lastMessage: formattedLastMessage,
        unreadCount: unreadMessages.length,
        eventId: conversation.eventId,
        participantCount: 2,
        createdAt: conversation.createdAt
      };
    }

    conversationResults.push(conversationInfo);
  }

  // Sort by last message date (newest first), handle null lastMessage
  return conversationResults.sort((a, b) => {
    const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
    const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
}

// Helper function to get conversation participant count
async function getConversationParticipantCount(conversationId: number): Promise<number> {
  const participants = await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.conversationId, conversationId)
  });
  return participants.length;
}

// Get messages for a conversation
export async function getConversationMessages(conversationId: number, userId: number) {
  // Verify user is a participant in the conversation
  const participation = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, userId)
    )
  });

  if (!participation) {
    throw new Error("User is not a participant in this conversation");
  }

  const rawMessages = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [asc(messages.createdAt)],
    with: {
      sender: {
        columns: {
          id: true,
          fullName: true,
          profileImage: true
        }
      }
    }
  });

  // Format messages for iOS compatibility
  return rawMessages.map(message => ({
    id: message.id,
    sender_id: message.senderId,
    receiver_id: message.receiverId,
    conversation_id: message.conversationId,
    content: message.content,
    createdAt: message.createdAt,
    is_read: message.isRead,
    sender: message.sender ? {
      id: message.sender.id,
      fullName: message.sender.fullName,
      profileImage: message.sender.profileImage
    } : null,
    receiver: null // For group messages, receiver is null
  }));
}

// Get messages between two users (legacy function for backward compatibility)
export async function getMessages(userId: number, otherId: number) {
  // Check if users are connected
  const connectionExists = await db.query.userConnections.findFirst({
    where: or(
      and(
        eq(userConnections.followerId, userId),
        eq(userConnections.followingId, otherId),
        eq(userConnections.status, "accepted")
      ),
      and(
        eq(userConnections.followerId, otherId),
        eq(userConnections.followingId, userId),
        eq(userConnections.status, "accepted")
      )
    )
  });

  // For now, we're going to log and allow messages even if users aren't connected
  if (!connectionExists) {
    console.log(`WARNING: Getting messages between non-connected users ${userId} and ${otherId}`);
    // Instead of throwing an error, we'll just continue
    // throw new Error("Users must be connected to view messages");
  }

  return db.query.messages.findMany({
    where: or(
      and(
        eq(messages.senderId, userId),
        eq(messages.receiverId, otherId)
      ),
      and(
        eq(messages.senderId, otherId),
        eq(messages.receiverId, userId)
      )
    ),
    orderBy: [asc(messages.createdAt)],
    with: {
      sender: {
        columns: {
          id: true,
          fullName: true,
          profileImage: true
        }
      },
      receiver: {
        columns: {
          id: true,
          fullName: true,
          profileImage: true
        }
      }
    }
  });
}

// Mark a message as read
export async function markMessageAsRead(messageId: number) {
  await db
    .update(messages)
    .set({ isRead: true })
    .where(eq(messages.id, messageId));

  // Return the updated message
  return db.query.messages.findFirst({
    where: eq(messages.id, messageId)
  });
}

// Mark all messages as read for a user (LEGACY - being replaced with conversation-based approach)
export async function markAllMessagesAsRead(userId: number) {
  // Only mark messages where user is the receiver
  return db
    .update(messages)
    .set({ isRead: true })
    .where(eq(messages.receiverId, userId));
}

// Mark all messages in a conversation as read for a specific user
export async function markConversationAsRead(conversationId: number, userId: number) {
  // Update lastReadAt timestamp for the user in this conversation
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, userId)
    ));
  
  // Also mark all messages in this conversation as read for this user
  // (This helps with backward compatibility and direct message queries)
  return db
    .update(messages)
    .set({ isRead: true })
    .where(eq(messages.conversationId, conversationId));
}

// Get or create an event group chat
export async function getOrCreateEventGroupChat(eventId: number, hostId: number): Promise<Conversation> {
  // First check if a conversation already exists for this event
  const existingConversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.eventId, eventId),
      eq(conversations.type, "event")
    )
  });

  if (existingConversation) {
    // Return in consistent format
    return {
      ...existingConversation,
      title: existingConversation.title || "Event Chat",
      lastMessage: null,
      unreadCount: 0,
      participantCount: await getConversationParticipantCount(existingConversation.id)
    } as any;
  }

  // Get event details for the conversation title
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: {
      title: true
    }
  });

  if (!event) {
    throw new Error(`Event with id ${eventId} not found`);
  }

  // Create new event conversation
  const newConversation: NewConversation = {
    title: `${event.title} - Group Chat`,
    type: "event",
    eventId: eventId,
    createdBy: hostId,
    createdAt: new Date()
  };

  const [createdConversation] = await db.insert(conversations)
    .values(newConversation)
    .returning();

  // Add the host as the first participant
  const hostParticipant: NewConversationParticipant = {
    conversationId: createdConversation.id,
    userId: hostId,
    joinedAt: new Date()
  };

  await db.insert(conversationParticipants)
    .values(hostParticipant);

  // Return in consistent format
  return {
    ...createdConversation,
    lastMessage: null,
    unreadCount: 0,
    participantCount: 1 // Only host initially
  } as any;
}

// Add a user to an event group chat
export async function addUserToEventGroupChat(conversationId: number, userId: number): Promise<void> {
  // Check if user is already a participant
  const existingParticipant = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, userId)
    )
  });

  if (existingParticipant) {
    // User is already in the chat, no need to add again
    return;
  }

  // Verify conversation exists
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId)
  });

  if (!conversation) {
    throw new Error(`Conversation with id ${conversationId} not found`);
  }

  // Verify user exists
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  // Add user to the conversation
  const newParticipant: NewConversationParticipant = {
    conversationId: conversationId,
    userId: userId,
    joinedAt: new Date()
  };

  await db.insert(conversationParticipants)
    .values(newParticipant);
}

// Alias for compatibility with tests
export const addUserToConversation = addUserToEventGroupChat;

// Send a message to a conversation (replaces the old direct messaging)
export async function sendMessageToConversation({ senderId, conversationId, content }: {
  senderId: number;
  conversationId: number;
  content: string;
}) {
  // Verify user is a participant in the conversation
  const participation = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, senderId)
    )
  });

  if (!participation) {
    throw new Error("User is not a participant in this conversation");
  }

  // Create the message
  const newMessage: NewMessage = {
    senderId,
    conversationId,
    content,
    createdAt: new Date(),
    isRead: false,
    // receiverId is null for group messages, will be set for direct messages if needed
    receiverId: null
  };

  const result = await db.insert(messages).values(newMessage).returning();

  // Get sender info for notification purposes
  const sender = await db.query.users.findFirst({
    where: eq(users.id, senderId),
    columns: {
      id: true,
      fullName: true,
      profileImage: true
    }
  });

  // Return the message with sender info formatted for iOS
  if (result.length > 0 && sender) {
    const message = result[0];
    return {
      id: message.id,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      conversation_id: message.conversationId,
      content: message.content,
      createdAt: message.createdAt,
      is_read: message.isRead,
      sender: {
        id: sender.id,
        fullName: sender.fullName,
        profileImage: sender.profileImage
      },
      receiver: null // For group messages, receiver is null
    };
  }

  // Fallback if no sender found
  if (result.length > 0) {
    const message = result[0];
    return {
      id: message.id,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      conversation_id: message.conversationId,
      content: message.content,
      createdAt: message.createdAt,
      is_read: message.isRead,
      sender: null,
      receiver: null
    };
  }

  throw new Error("Failed to create message");
}

// Create or find a direct conversation between two users
export async function getOrCreateDirectConversation(userId1: number, userId2: number): Promise<ExtendedConversation> {
  console.log(`[DEDUP] Looking for existing conversation between users ${userId1} and ${userId2}`);
  
  // Search through all direct conversations to find one with exactly these two participants
  const allDirectConversations = await db.query.conversations.findMany({
    where: and(
      eq(conversations.type, "direct"),
      isNull(conversations.eventId)
    ),
    with: {
      participants: true
    }
  });

  console.log(`[DEDUP] Found ${allDirectConversations.length} direct conversations to check`);

  for (const conversation of allDirectConversations) {
    const participantIds = conversation.participants.map(p => p.userId);
    console.log(`[DEDUP] Conversation ${conversation.id} has participants: ${participantIds.join(', ')}`);
    
    if (participantIds.length === 2 && 
        participantIds.includes(userId1) && 
        participantIds.includes(userId2)) {
      console.log(`[DEDUP] ✅ Found existing conversation ${conversation.id} between users ${userId1} and ${userId2}`);
      // Format the found conversation properly for iOS
      return {
        id: conversation.id,
        type: conversation.type,
        title: conversation.title || "Direct Message",
        last_message: null, // This could be enhanced to fetch the actual last message
        unreadCount: 0, // This could be enhanced to calculate actual unread count
        event_id: conversation.eventId,
        participant_count: 2,
        createdAt: conversation.createdAt || new Date()
      };
    }
  }

  console.log(`[DEDUP] ❌ No existing conversation found between users ${userId1} and ${userId2}, creating new one`);

  // No existing conversation found, create a new one
  const newConversation: NewConversation = {
    title: null, // Direct conversations don't need titles
    type: "direct",
    eventId: null,
    createdBy: userId1,
    createdAt: new Date()
  };

  const [createdConversation] = await db.insert(conversations)
    .values(newConversation)
    .returning();

  // Add both users as participants
  const participants: NewConversationParticipant[] = [
    {
      conversationId: createdConversation.id,
      userId: userId1,
      joinedAt: new Date()
    },
    {
      conversationId: createdConversation.id,
      userId: userId2,
      joinedAt: new Date()
    }
  ];

  await db.insert(conversationParticipants)
    .values(participants);

  // Return the conversation in the format expected by iOS
  return {
    id: createdConversation.id,
    type: createdConversation.type,
    title: createdConversation.title || "Direct Message", // Provide default title for direct messages
    last_message: null, // New conversations don't have messages yet
    unreadCount: 0, // New conversations start with 0 unread
    event_id: createdConversation.eventId,
    participant_count: 2, // Direct conversations always have 2 participants
    createdAt: createdConversation.createdAt || new Date()
  };
}