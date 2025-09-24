import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/hooks/use-user';
import { useMessages, useMessageNotifications } from '@/hooks/use-messages';
import { Conversation } from '@/types/inbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Search, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { useTranslation } from '@/lib/translations';
import { InboxSection } from '@/components/inbox/InboxSection';

export default function InboxPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const { user } = useUser();
  const { conversations, loading, error, fetchConversations, markAllAsRead, connectSocket } = useMessages();
  const { showNotification } = useMessageNotifications();
  const [, setLocation] = useLocation();

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

  // Organize conversations into sections based on type and content
  const organizeConversations = (conversations: Conversation[]) => {
    // For now, we'll create sections for different conversation types
    // In the future, this could include connection requests, etc.
    const directMessages = conversations.filter(conv => conv.type === 'direct');
    const groupChats = conversations.filter(conv => conv.type === 'group');
    const eventChats = conversations.filter(conv => conv.type === 'event');
    
    return {
      directMessages,
      groupChats,
      eventChats,
      hasAnyConversations: conversations.length > 0
    };
  };
  
  const { directMessages, groupChats, eventChats, hasAnyConversations } = organizeConversations(filteredConversations);

  if (!user) {
    return (
      <div className="container max-w-4xl py-8 mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">You need to sign in</h3>
              <p className="text-sm text-gray-500 mt-2">Sign in to view your messages</p>
              <Button
                className="mt-4"
                onClick={() => setLocation('/login')}
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unreadCount = conversations.reduce(
    (count, conv) => count + (conv.unreadCount || 0),
    0
  );

  return (
    <div className="container max-w-4xl py-8 mx-auto px-4 sm:px-6 lg:px-8">
      <GradientHeader
        title={t('inbox')}
        backButtonFallbackPath="/discover"
        className="mb-4"
      />
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="flex items-center">
              {t('inbox')}
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-primary">{unreadCount}</Badge>
              )}
            </CardTitle>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </CardHeader>
        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchMessages')}
              className="pl-8 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading conversations: {error}</p>
            </div>
          ) : !hasAnyConversations ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {searchTerm ? (
                <>
                  <XCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No results found</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('noConversationsMatch')}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={clearSearch}>
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">{t('noConversationsYet')}</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('connectWithOthers')}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setLocation('/connect')}
                  >
                    {t('findConnections')}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6" data-testid="inbox-content">
              {/* Direct Messages Section */}
              <InboxSection
                title="Direct Messages"
                conversations={directMessages}
              />
              
              {/* Group Chats Section */}
              <InboxSection
                title="Group Chats"
                conversations={groupChats}
              />
              
              {/* Event Chats Section */}
              <InboxSection
                title="Event Chats"
                conversations={eventChats}
              />
              
              {/* Show message if search returned no results but we have conversations */}
              {searchTerm && hasAnyConversations && directMessages.length === 0 && groupChats.length === 0 && eventChats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <XCircle className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    No conversations match "{searchTerm}"
                  </p>
                  <Button variant="outline" className="mt-2" onClick={clearSearch}>
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}