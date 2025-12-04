import React, { useEffect, useRef, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ArrowLeft, SendIcon, AlertCircle, CheckCircle, Users, ChevronLeft } from 'lucide-react';
import { ConversationMessage } from '@/types/inbox';
import { BottomNav } from '@/components/ui/bottom-nav';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';

interface ConversationInfo {
  id: number;
  type: string;
  title: string;
  participantCount: number;
  participants: {
    id: number;
    fullName?: string;
    username?: string;
    profileImage?: string;
  }[];
  otherParticipant?: {
    id: number;
    fullName?: string;
    username?: string;
    profileImage?: string;
  };
}

interface ConversationMessagesResponse {
  messages: ConversationMessage[];
  conversation: ConversationInfo;
}

export default function ChatConversationPage() {
  const [match, params] = useRoute('/chat/conversation/:conversationId');
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const conversationId = params?.conversationId ? parseInt(params.conversationId) : null;

  // Fetch conversation messages and info
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery<ConversationMessagesResponse>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: () => fetch(`/api/conversations/${conversationId}/messages`, { credentials: 'include' }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
    enabled: !!conversationId && !!user?.id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  const messages = data?.messages || [];
  const conversation = data?.conversation;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !user?.id) throw new Error('Missing required data');
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          senderId: user.id,
          content: content.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });
      setMessageText('');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    
    await sendMessageMutation.mutateAsync(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const formatTime = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return format(date, 'h:mm a');
  };

  const formatMessageDate = (message: ConversationMessage, index: number) => {
    const currentDate = typeof message.createdAt === 'string' ? 
      new Date(message.createdAt) : message.createdAt;
    
    // For the first message, always show the date
    if (index === 0) {
      return format(currentDate, 'MMMM d, yyyy');
    }
    
    // For subsequent messages, check if the date has changed
    const prevMessage = messages[index - 1];
    const prevDate = typeof prevMessage.createdAt === 'string' ? 
      new Date(prevMessage.createdAt) : prevMessage.createdAt;
    
    if (
      currentDate.getDate() !== prevDate.getDate() ||
      currentDate.getMonth() !== prevDate.getMonth() ||
      currentDate.getFullYear() !== prevDate.getFullYear()
    ) {
      return format(currentDate, 'MMMM d, yyyy');
    }
    
    return null;
  };

  const isGroupChat = conversation?.type === 'group' || conversation?.type === 'event';

  if (!user) {
    return (
      <div className="container max-w-4xl py-8 mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium">You need to sign in</h3>
              <p className="text-sm text-gray-500 mt-2">Sign in to view messages</p>
              <Button
                className="mt-4"
                onClick={() => setLocation('/auth')}
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match || !conversationId) {
    return (
      <div className="container max-w-4xl py-8 mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium">Invalid Conversation</h3>
              <p className="text-sm text-gray-500 mt-2">The conversation could not be found</p>
              <Button
                variant="outline"
                size="icon"
                className="mt-4"
                onClick={() => setLocation('/inbox')}
                aria-label="Back to inbox"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Back to Inbox</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* Fixed Header - MALY logo, page title, back button, and hamburger menu */}
      <header className="sticky top-0 bg-background border-b border-border shrink-0 z-50">
        <div className="px-4 pt-3">
          {/* Row 1: MALY Logo left, Hamburger right */}
          <div className="flex items-center justify-between pb-2">
            <img 
              src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
              alt="MÁLY" 
              className="h-12 w-auto"
            />
            <HamburgerMenu />
          </div>
          
          {/* Row 2: Page title */}
          <h1 className="gradient-text text-lg font-medium uppercase pb-2" style={{ letterSpacing: '0.3em' }}>
            C H A T S
          </h1>
          
          {/* Row 3: Back button */}
          <div className="pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/inbox')}
              data-testid="back-to-inbox"
              className="text-foreground hover:bg-foreground/10 p-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Fixed Profile Bar - Sticky under header, never moves */}
      <div className="w-full bg-background border-b border-border shrink-0 z-40">
        <div className="flex flex-row items-center px-5 py-3">
          {isLoading && !conversation ? (
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full bg-muted" />
              <div className="ml-3">
                <Skeleton className="h-4 w-[120px] bg-muted" />
                <Skeleton className="h-3 w-[80px] mt-1 bg-muted" />
              </div>
            </div>
          ) : conversation ? (
            <div className="flex items-center flex-1">
              {!isGroupChat && conversation.otherParticipant ? (
                <button
                  type="button"
                  onClick={() => {
                    const profileIdentifier = conversation.otherParticipant?.username || String(conversation.otherParticipant?.id || '');
                    if (profileIdentifier) {
                      setLocation(`/profile/${profileIdentifier}?from=/chat/conversation/${conversationId}`);
                    }
                  }}
                  className="relative"
                  data-testid="conversation-avatar-button"
                >
                  <Avatar className="h-10 w-10">
                    {conversation.otherParticipant?.profileImage && (
                      <AvatarImage 
                        src={conversation.otherParticipant.profileImage} 
                        alt={conversation.otherParticipant.fullName || conversation.otherParticipant.username || 'User'} 
                      />
                    )}
                    <AvatarFallback className="bg-muted text-foreground">
                      {conversation.title.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-foreground">
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              <div className="ml-3">
                <h3 className="text-foreground font-medium text-base" data-testid="conversation-title">
                  {conversation.title}
                  {isGroupChat && (
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      ({conversation.participantCount} members)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isGroupChat ? 'Group Chat' : 'Direct Message'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-foreground">?</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <h3 className="text-base text-foreground font-medium">Loading...</h3>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Messages Area - Only this section scrolls */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-background pb-36" 
        style={{ overscrollBehavior: 'contain' }}
        data-testid="messages-container"
      >
            {isLoading && messages.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className={`h-16 w-56 rounded-lg ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Unable to load messages</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    {error instanceof Error ? error.message : 'Something went wrong'}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setLocation('/inbox')}
                  >
                    Back to Inbox
                  </Button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <SendIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Send a message to start the conversation
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isCurrentUser = Number(message.sender_id) === user.id;
                  const dateHeader = formatMessageDate(message, index);
                  
                  return (
                    <React.Fragment key={message.id}>
                      {dateHeader && (
                        <div className="flex justify-center my-4">
                          <div className="px-3 py-1 bg-muted rounded-full text-xs">
                            {dateHeader}
                          </div>
                        </div>
                      )}
                      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isCurrentUser && message.sender && (
                            <button
                              type="button"
                              onClick={() => {
                                const profileIdentifier = message.sender?.username || String(message.sender?.id || '');
                                if (profileIdentifier) {
                                  setLocation(`/profile/${profileIdentifier}?from=/chat/conversation/${conversationId}`);
                                }
                              }}
                              data-testid={`message-avatar-${message.id}`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.sender?.profileImage || undefined} alt={message.sender?.fullName || 'User'} />
                                <AvatarFallback>
                                  {message.sender?.fullName?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          )}
                          <div>
                            <div className={`px-4 py-2 rounded-lg ${isCurrentUser 
                              ? 'bg-primary text-primary-foreground rounded-tr-none' 
                              : 'bg-muted rounded-tl-none'
                            }`}>
                              {message.content}
                            </div>
                            <div className={`flex items-center text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              {formatTime(message.createdAt)}
                              {isCurrentUser && message.is_read && (
                                <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                              )}
                            </div>
                          </div>
                          {isCurrentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profileImage || undefined} alt={user.fullName || 'You'} />
                              <AvatarFallback>
                                {user.fullName?.substring(0, 2).toUpperCase() || user.username?.substring(0, 2).toUpperCase() || 'Y'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
      </div>
      
      {/* Fixed Message Input - Absolutely positioned above bottom navigation */}
      <div 
        className="fixed left-0 right-0 px-4 pt-3 bg-background border-t border-border z-50"
        style={{ bottom: '80px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <form onSubmit={handleSendMessage} className="flex items-end gap-2" data-testid="message-form">
          <div className="flex-1">
            <Textarea 
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[50px] max-h-[120px] resize-none bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary rounded-2xl"
              disabled={sendMessageMutation.isPending}
              data-testid="message-input"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="h-10 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:opacity-90"
            data-testid="send-button"
          >
            <SendIcon className="h-4 w-4 text-white" />
          </Button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}