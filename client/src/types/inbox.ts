// Types that match the backend JSON structure from GET /api/conversations/:userId

export interface ConversationMessage {
  id: number;
  sender_id: number;
  receiver_id: number | null;
  conversation_id: number | null;
  content: string;
  createdAt: Date;
  is_read: boolean;
  sender: {
    id: number;
    username?: string;
    fullName?: string;
    profileImage?: string;
  } | null;
  receiver: {
    id: number;
    username?: string;
    fullName?: string;
    profileImage?: string;
  } | null;
}

export interface OtherParticipant {
  id: number;
  username?: string;
  fullName?: string;
  profileImage?: string;
}

export interface Conversation {
  id: number;
  type: "direct" | "event" | "group";
  title: string;
  lastMessage: ConversationMessage | null;
  unreadCount: number;
  eventId?: number | null;
  participantCount: number;
  createdAt: Date;
  // Only present for direct conversations
  otherParticipant?: OtherParticipant;
}

// Utility types for sectioning conversations
export type ConversationSection = {
  title: string;
  conversations: Conversation[];
};

// Helper functions for conversation display
export const getConversationDisplayName = (conversation: Conversation): string => {
  if (conversation.type === 'direct' && conversation.otherParticipant) {
    return conversation.otherParticipant.fullName || conversation.otherParticipant.username || 'Unknown User';
  }
  return conversation.title;
};

export const getConversationDisplayImage = (conversation: Conversation): string | null => {
  if (conversation.type === 'direct' && conversation.otherParticipant) {
    return conversation.otherParticipant.profileImage || null;
  }
  // For group/event chats, we could return a default group image or null
  return null;
};

export const getConversationDisplayInitials = (conversation: Conversation): string => {
  const displayName = getConversationDisplayName(conversation);
  const words = displayName.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
};