import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useMessages, useMessageNotifications } from '@/hooks/use-messages';
import { Conversation } from '@/types/inbox';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, XCircle, ChevronRight, UserPlus, Calendar, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/translations';

interface ConnectionRequest {
  id: number;
  fullName?: string;
  username?: string;
  profileImage?: string;
  status: 'pending';
  createdAt: string;
}


interface RSVPRequest {
  id: number;
  eventId: number;
  eventTitle: string;
  userName: string;
  userImage?: string;
  status: 'pending';
  createdAt: string;
}

export default function InboxPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const { user } = useUser();
  const { conversations, loading: conversationsLoading, error, fetchConversations, markAllAsRead, connectSocket } = useMessages();
  const { showNotification } = useMessageNotifications();
  const [, setLocation] = useLocation();

  // Fetch connection requests
  const { data: connectionRequests = [], isLoading: connectionRequestsLoading } = useQuery<ConnectionRequest[]>({
    queryKey: ['/api/connections/pending'],
    enabled: !!user?.id,
  });


  // Fetch RSVP requests (for events the user created)
  const { data: rsvpRequests = [], isLoading: rsvpRequestsLoading } = useQuery<RSVPRequest[]>({
    queryKey: ['/api/events/applications'],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id);
      connectSocket(user.id);
    }
  }, [user, fetchConversations, connectSocket]);
  
  // Listen for new message events
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const message = event.detail;
      showNotification(message);
      // Refresh conversations when receiving a new message
      if (user?.id) {
        fetchConversations(user.id);
      }
    };
    
    // Add event listener for new message notifications
    document.addEventListener('new-message', handleNewMessage as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('new-message', handleNewMessage as EventListener);
    };
  }, [showNotification, fetchConversations, user]);

  useEffect(() => {
    setFilteredConversations(
      conversations.filter(
        (conv) => {
          const displayName = conv.type === 'direct' && conv.otherParticipant 
            ? (conv.otherParticipant.fullName || conv.otherParticipant.username || '')
            : conv.title;
          
          const lastMessageContent = conv.lastMessage?.content || '';
          
          return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase());
        }
      )
    );
  }, [conversations, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead(user.id);
    }
  };

  const loading = conversationsLoading || connectionRequestsLoading || rsvpRequestsLoading;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-white">You need to sign in</h3>
          <p className="text-sm text-gray-500 mt-2">Sign in to view your messages</p>
          <Button
            className="mt-4"
            onClick={() => setLocation('/auth')}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const unreadCount = conversations.reduce(
    (count, conv) => count + (conv.unreadCount || 0),
    0
  );

  // Filter conversations for proper section display
  // Messages & Groups: Only conversations with message history
  const conversationsWithMessages = conversations.filter(conv => conv.lastMessage !== null);
  
  // My Connections: Only connections without message history (direct conversations only)
  const connectionsWithoutMessages = conversations.filter(conv => 
    conv.lastMessage === null && conv.type === 'direct'
  );

  // Helper function to render individual inbox items
  const renderInboxItem = ({ 
    title, 
    subtitle, 
    avatar, 
    onPress, 
    showChevron = true,
    testId
  }: {
    title: string;
    subtitle: string;
    avatar?: string;
    onPress: () => void;
    showChevron?: boolean;
    testId?: string;
  }) => (
    <button
      onClick={onPress}
      className="w-full flex items-center px-4 py-3 hover:bg-gray-900 active:bg-gray-800 transition-colors"
      data-testid={testId}
    >
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={avatar} alt={title} />
        <AvatarFallback className="bg-gray-700 text-gray-300">
          <UserPlus className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 text-left">
        <h4 className="text-white font-medium text-sm">{title}</h4>
        <p className="text-gray-400 text-xs">{subtitle}</p>
      </div>
      {showChevron && <ChevronRight className="h-4 w-4 text-gray-400" />}
    </button>
  );

  // Helper function to render section headers
  const renderSectionHeader = (title: string, count: number) => (
    <div className="flex items-center justify-between px-4 py-2">
      <h3 className="text-white font-medium text-base">{title}</h3>
      <span className="text-white font-medium text-base">{count}</span>
    </div>
  );

  // Helper function to render empty state
  const renderEmptyState = (message: string) => (
    <div className="px-4 py-2">
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-center py-4 border-b border-gray-800">
        <h1 className="text-white font-semibold text-lg" data-testid="inbox-title">Inbox</h1>
        <div className="absolute right-4">
          <h2 className="text-white font-bold text-xl tracking-wider">MALY</h2>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[150px] bg-gray-700" />
                <Skeleton className="h-3 w-[100px] bg-gray-700" />
              </div>
              <Skeleton className="h-4 w-4 bg-gray-700" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8 pb-20" data-testid="inbox-content">
          {/* Connection Requests Section */}
          <div className="space-y-2">
            {renderSectionHeader('Connection Requests', connectionRequests.length)}
            {connectionRequests.length === 0 ? (
              renderEmptyState('No pending connection requests')
            ) : (
              <div>
                {connectionRequests.map((request) => 
                  renderInboxItem({
                    title: request.fullName || request.username || 'Unknown User',
                    subtitle: 'Wants to connect',
                    avatar: request.profileImage,
                    onPress: () => setLocation(`/profile/${request.username || request.id}`),
                    testId: `connection-request-${request.id}`
                  })
                )}
              </div>
            )}
          </div>

          {/* RSVP Requests Section */}
          <div className="space-y-2">
            {renderSectionHeader('RSVP Requests', rsvpRequests.length)}
            {rsvpRequests.length === 0 ? (
              renderEmptyState('No pending RSVP requests')
            ) : (
              <div>
                {rsvpRequests.map((request) => 
                  renderInboxItem({
                    title: request.userName,
                    subtitle: `Wants to join ${request.eventTitle}`,
                    avatar: request.userImage,
                    onPress: () => setLocation(`/event/${request.eventId}`),
                    testId: `rsvp-request-${request.id}`
                  })
                )}
              </div>
            )}
          </div>

          {/* My Connections Section */}
          <div className="space-y-2">
            {renderSectionHeader('My Connections', connectionsWithoutMessages.length)}
            {connectionsWithoutMessages.length === 0 ? (
              renderEmptyState('No connections yet')
            ) : (
              <div>
                {connectionsWithoutMessages.slice(0, 5).map((conversation) => {
                  // For connections without messages, use the title field which contains the other user's name
                  const displayName = conversation.title || 'Unknown User';
                  
                  return renderInboxItem({
                    title: displayName,
                    subtitle: 'Connected',
                    avatar: undefined, // Avatar not available for connections without messages
                    onPress: () => setLocation(`/chat/conversation/${conversation.id}`), // Navigate to start conversation
                    testId: `connection-${conversation.id}`
                  });
                })}
                {connectionsWithoutMessages.length > 5 && (
                  <button
                    onClick={() => setLocation('/connections')}
                    className="w-full flex items-center px-4 py-3 hover:bg-gray-900 active:bg-gray-800 transition-colors"
                    data-testid="view-all-connections"
                  >
                    <div className="flex-1 text-left">
                      <h4 className="text-blue-400 font-medium text-sm">View All Connections</h4>
                    </div>
                    <ChevronRight className="h-4 w-4 text-blue-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Messages & Groups Section */}
          <div className="space-y-2">
            {renderSectionHeader('Messages & Groups', conversationsWithMessages.length)}
            {conversationsWithMessages.length === 0 ? (
              renderEmptyState('No messages yet')
            ) : (
              <div>
                {conversationsWithMessages.map((conversation) => {
                  const displayName = conversation.type === 'direct' && conversation.otherParticipant 
                    ? (conversation.otherParticipant.fullName || conversation.otherParticipant.username || 'Unknown User')
                    : conversation.title;
                  
                  const displaySubtitle = conversation.lastMessage?.content 
                    ? conversation.lastMessage.content 
                    : 'No messages yet';

                  const avatarUrl = conversation.type === 'direct' && conversation.otherParticipant
                    ? conversation.otherParticipant.profileImage
                    : undefined;
                  
                  return renderInboxItem({
                    title: displayName,
                    subtitle: displaySubtitle,
                    avatar: avatarUrl,
                    onPress: () => setLocation(`/chat/conversation/${conversation.id}`),
                    testId: `conversation-${conversation.id}`
                  });
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}