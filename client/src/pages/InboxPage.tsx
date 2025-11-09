import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useMessages, useMessageNotifications } from '@/hooks/use-messages';
import { Conversation } from '@/types/inbox';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, XCircle, ChevronRight, UserPlus, Calendar, Users, ChevronDown, ChevronUp, Check, X, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/translations';
import { BottomNav } from '@/components/ui/bottom-nav';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';

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
  userId: number;
  status: 'pending';
  createdAt: string;
}

interface ConnectionUser {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  requestDate?: string;
  connectionDate?: string;
  connectionType?: string;
  status?: string;
}

export default function InboxPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'contacts'>('all');
  const { user } = useUser();
  const { conversations, loading: conversationsLoading, error, fetchConversations, markAllAsRead, connectSocket } = useMessages();
  const { showNotification } = useMessageNotifications();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // No more connection requests - contacts are added instantly


  // Fetch RSVP requests (for events the user created)
  const { data: rsvpData, isLoading: rsvpRequestsLoading } = useQuery<{ applications: any[], totalPending: number }>({
    queryKey: ['/api/events/applications'],
    queryFn: async () => {
      const response = await fetch('/api/events/applications');
      if (!response.ok) throw new Error('Failed to fetch RSVP requests');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Transform the API response to match the frontend format
  const rsvpRequests: RSVPRequest[] = rsvpData?.applications?.map((app: any) => ({
    id: app.id,
    eventId: app.eventId,
    eventTitle: app.eventTitle,
    userName: app.username || app.fullName || 'Unknown User',
    userImage: app.profileImage,
    userId: app.userId,
    status: 'pending',
    createdAt: app.createdAt
  })) || [];

  // Mutation for accepting/declining RSVP requests
  const handleRSVPMutation = useMutation({
    mutationFn: async ({ eventId, userId, action }: { eventId: number; userId: number; action: 'approved' | 'rejected' }) => {
      const response = await fetch(`/api/events/${eventId}/applications/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update RSVP request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refetch RSVP requests to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/events/applications'] });
    },
  });

  // Fetch contacts (users in the current user's contacts list)
  const {
    data: connections = [],
    isLoading: connectionsLoading,
    error: connectionsError
  } = useQuery<ConnectionUser[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts");
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
    enabled: !!user,
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

  // Separate conversations into direct messages and group chats
  const directMessages = filteredConversations.filter(conv => conv.type === 'direct');
  const groupChats = filteredConversations.filter(conv => conv.type === 'event' || conv.type === 'group');

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead(user.id);
    }
  };

  const loading = conversationsLoading || rsvpRequestsLoading || connectionsLoading;

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
    <div className="h-screen flex flex-col overflow-hidden bg-black text-white">
      {/* Header - Fixed at top */}
      <header className="bg-black text-white shrink-0 z-50">
        {/* Top bar with MÁLY logo on left and hamburger menu on right */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
          <HamburgerMenu />
        </div>
        
        {/* Inbox title with gradient */}
        <div className="px-5 pb-3">
          <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }} data-testid="inbox-title">Inbox</h2>
        </div>

        {/* Filter Bar - Always Present */}
        <div className="bg-black border-b border-gray-800">
          <div className="px-5 py-3 flex items-center justify-between">
            <button
              onClick={() => setActiveFilter('all')}
              className={`text-sm transition-colors ${
                activeFilter === 'all' 
                  ? 'text-purple-400 font-medium' 
                  : 'text-white hover:text-purple-400'
              }`}
              data-testid="filter-all"
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('groups')}
              className={`text-sm transition-colors ${
                activeFilter === 'groups' 
                  ? 'text-purple-400 font-medium' 
                  : 'text-white hover:text-purple-400'
              }`}
              data-testid="filter-groups"
            >
              Groups
            </button>
            <button
              onClick={() => setActiveFilter('contacts')}
              className={`text-sm transition-colors ${
                activeFilter === 'contacts' 
                  ? 'text-purple-400 font-medium' 
                  : 'text-white hover:text-purple-400'
              }`}
              data-testid="filter-contacts"
            >
              Contacts
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
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
          <div className="pb-20" data-testid="inbox-content">
          {/* All Filter - Show All Messages in a Simple List */}
          {activeFilter === 'all' && (
            <div>
              {filteredConversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-400 text-sm">No messages yet</p>
                </div>
              ) : (
                <div>
                  {filteredConversations.map((conversation) => {
                    // Handle both direct messages and group chats
                    const displayName = conversation.type === 'direct' && conversation.otherParticipant 
                      ? (conversation.otherParticipant.fullName || conversation.otherParticipant.username || 'Unknown User')
                      : conversation.type === 'event' && conversation.title 
                        ? conversation.title.replace(' - Event Chat', ' Group Thread')
                        : (conversation.title || 'Group Chat');
                    
                    const displaySubtitle = conversation.lastMessage?.content 
                      ? conversation.lastMessage.content 
                      : conversation.type === 'direct'
                        ? 'No messages yet'
                        : `${conversation.participantCount} members`;

                    const avatarUrl = conversation.type === 'direct' 
                      ? conversation.otherParticipant?.profileImage
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
          )}

          {/* Groups Filter - Show Only Group Chats */}
          {activeFilter === 'groups' && (
            <div className="space-y-2">
              {groupChats.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-400 text-sm">No group chats yet</p>
                </div>
              ) : (
                <div>
                  {groupChats.map((conversation) => {
                    const displayName = conversation.type === 'event' && conversation.title 
                      ? conversation.title.replace(' - Event Chat', ' Group Thread')
                      : (conversation.title || 'Group Chat');
                    
                    const displaySubtitle = conversation.lastMessage?.content 
                      ? conversation.lastMessage.content 
                      : `${conversation.participantCount} members`;
                    
                    return renderInboxItem({
                      title: displayName,
                      subtitle: displaySubtitle,
                      avatar: undefined,
                      onPress: () => setLocation(`/chat/conversation/${conversation.id}`),
                      testId: `group-conversation-${conversation.id}`
                    });
                  })}
                </div>
              )}
            </div>
          )}

          {/* Contacts Filter - Show Only Connections */}
          {activeFilter === 'contacts' && (
            <div className="space-y-2">
              {connections.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-400 text-sm">No connections yet</p>
                </div>
              ) : (
                <div>
                  {connections.map((connection) => {
                    return renderInboxItem({
                      title: connection.fullName || connection.username,
                      subtitle: 'Connected',
                      avatar: connection.profileImage || undefined,
                      onPress: () => setLocation(`/profile/${connection.username}`),
                      testId: `connection-${connection.id}`
                    });
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
      {/* Scrollable content area end */}
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}