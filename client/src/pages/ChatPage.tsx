import React, { useEffect, useRef, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useUser } from '@/hooks/use-user';
import { useMessages, Message, useMessageNotifications } from '@/hooks/use-messages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ArrowLeft, SendIcon, AlertCircle, CheckCircle } from 'lucide-react';

export default function ChatPage() {
  const [match, params] = useRoute('/chat/:id');
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'not-connected'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useMessageNotifications();
  const { 
    messages, 
    loading, 
    error, 
    fetchMessages, 
    sendMessage, 
    markAsRead,
    connectSocket,
    disconnectSocket,
    socketConnected
  } = useMessages();
  
  // Fetch other user details and check connection status
  useEffect(() => {
    if (!match || !params?.id || !user?.id) return;
    
    const fetchUserDetailsAndConnection = async () => {
      try {
        // Fetch user profile
        const profileResponse = await fetch(`/api/users/profile/${params.id}`);
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          setOtherUser(userData);
        } else {
          console.error('Failed to fetch user details');
          throw new Error('Could not retrieve user information');
        }
        
        // Check connection status between users
        const connectionResponse = await fetch(`/api/connections/status/${params.id}`);
        if (connectionResponse.ok) {
          const connectionData = await connectionResponse.json();
          
          // Check if there's an accepted connection in either direction
          const hasOutgoingAccepted = connectionData.outgoing && connectionData.outgoing.status === 'accepted';
          const hasIncomingAccepted = connectionData.incoming && connectionData.incoming.status === 'accepted';
          
          if (hasOutgoingAccepted || hasIncomingAccepted) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('not-connected');
          }
        } else {
          console.error('Failed to check connection status');
          setConnectionStatus('not-connected');
        }
      } catch (error) {
        console.error('Error fetching user details or connection status:', error);
        setConnectionStatus('not-connected');
      }
    };
    
    fetchUserDetailsAndConnection();
  }, [match, params?.id, user?.id]);
  
  // Fetch messages and connect to websocket only if users are connected
  useEffect(() => {
    if (!user?.id || !params?.id || connectionStatus !== 'connected') return;
    
    const otherId = parseInt(params.id);
    fetchMessages(user.id, otherId);
    connectSocket(user.id);
    
    return () => {
      disconnectSocket();
    };
  }, [user?.id, params?.id, connectionStatus, fetchMessages, connectSocket, disconnectSocket]);
  
  // Mark unread messages as read
  useEffect(() => {
    if (!user?.id || !messages.length) return;
    
    const unreadMessages = messages.filter(
      msg => msg.receiverId === user.id && !msg.isRead
    );
    
    unreadMessages.forEach(msg => {
      markAsRead(msg.id);
    });
  }, [messages, user?.id, markAsRead]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Listen for new message events
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const message = event.detail;
      showNotification(message);
    };
    
    // Add event listener for new message notifications
    document.addEventListener('new-message', handleNewMessage as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('new-message', handleNewMessage as EventListener);
    };
  }, [showNotification]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user?.id || !params?.id) return;
    
    try {
      await sendMessage({
        senderId: user.id,
        receiverId: parseInt(params.id),
        content: messageText.trim()
      });
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };
  
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };
  
  const formatMessageDate = (message: Message, index: number) => {
    const currentDate = new Date(message.createdAt);
    
    // For the first message, always show the date
    if (index === 0) {
      return format(currentDate, 'MMMM d, yyyy');
    }
    
    // For subsequent messages, check if the date has changed
    const prevDate = new Date(messages[index - 1].createdAt);
    
    if (
      currentDate.getDate() !== prevDate.getDate() ||
      currentDate.getMonth() !== prevDate.getMonth() ||
      currentDate.getFullYear() !== prevDate.getFullYear()
    ) {
      return format(currentDate, 'MMMM d, yyyy');
    }
    
    return null;
  };
  
  const renderMessageStatus = (message: Message) => {
    if (message.senderId === user?.id) {
      return message.isRead ? (
        <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
      ) : (
        <CheckCircle className="h-4 w-4 text-gray-400 ml-1" />
      );
    }
    return null;
  };
  
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
  
  return (
    <div className="container max-w-4xl py-8 mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setLocation('/inbox')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {loading && !otherUser ? (
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px] mt-1" />
              </div>
            </div>
          ) : otherUser ? (
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser.profileImage || undefined} alt={otherUser.fullName || 'User'} />
                <AvatarFallback>
                  {otherUser.fullName?.[0] || otherUser.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <CardTitle className="text-base">
                  {otherUser.fullName || otherUser.username || 'User'}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {connectionStatus === 'connected' ? (socketConnected ? 'Online' : 'Offline') : 'Not Connected'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <CardTitle className="text-base">User</CardTitle>
              </div>
            </div>
          )}
        </CardHeader>
        
        <div className="flex flex-col h-[60vh]">
          {connectionStatus === 'checking' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto mt-2" />
              </div>
            </div>
          ) : connectionStatus === 'not-connected' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Connection Required</h3>
                <p className="text-sm text-gray-500 mt-2 mb-6">
                  You need to establish a connection with this user before you can exchange messages. Connect with them first and try again.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button 
                    onClick={() => setLocation(`/profile/${otherUser?.username || params?.id}`)} 
                    className="flex-1"
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/inbox')}
                    className="flex-1"
                  >
                    Back to Inbox
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && messages.length === 0 ? (
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
                      <p className="text-sm text-gray-500 mt-2">{error}</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <SendIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No messages yet</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Send a message to start a conversation
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isCurrentUser = message.senderId === user.id;
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
                                    {message.sender?.fullName?.[0] || 'U'}
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
                                  {renderMessageStatus(message)}
                                </div>
                              </div>
                              {isCurrentUser && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.profileImage || undefined} alt={user.fullName || 'You'} />
                                  <AvatarFallback>
                                    {user.fullName?.[0] || user.username?.[0] || 'Y'}
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
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea 
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!messageText.trim() || loading}
                    className="h-10"
                  >
                    <SendIcon className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}