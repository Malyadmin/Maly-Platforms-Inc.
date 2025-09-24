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
import { ArrowLeft, SendIcon, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { ConversationMessage } from '@/types/inbox';

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
                className="mt-4"
                onClick={() => setLocation('/inbox')}
              >
                Back to Inbox
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setLocation('/inbox')}
            data-testid="back-to-inbox"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {isLoading && !conversation ? (
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px] mt-1" />
              </div>
            </div>
          ) : conversation ? (
            <div className="flex items-center">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  {!isGroupChat && conversation.otherParticipant?.profileImage && (
                    <AvatarImage 
                      src={conversation.otherParticipant.profileImage} 
                      alt={conversation.otherParticipant.fullName || conversation.otherParticipant.username || 'User'} 
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {isGroupChat ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      conversation.title.substring(0, 2).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                {isGroupChat && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <CardTitle className="text-base" data-testid="conversation-title">
                  {conversation.title}
                  {isGroupChat && (
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      ({conversation.participantCount} members)
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isGroupChat ? 'Group Chat' : 'Direct Message'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <CardTitle className="text-base">Loading...</CardTitle>
              </div>
            </div>
          )}
        </CardHeader>
        
        <div className="flex flex-col h-[60vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
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
                  <SendIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Send a message to start the conversation
                  </p>
                </div>
              </div>
            ) : (
              <>
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
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender?.profileImage || undefined} alt={message.sender?.fullName || 'User'} />
                              <AvatarFallback>
                                {message.sender?.fullName?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
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
              </>
            )}
          </div>
          
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2" data-testid="message-form">
              <div className="flex-1">
                <Textarea 
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[80px] resize-none"
                  disabled={sendMessageMutation.isPending}
                  data-testid="message-input"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                className="h-10"
                data-testid="send-button"
              >
                <SendIcon className="h-4 w-4 mr-2" />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}