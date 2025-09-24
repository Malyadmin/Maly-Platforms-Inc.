import { create } from 'zustand';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { Conversation, ConversationMessage } from '@/types/inbox';

// Keep the old Message interface for backward compatibility with direct messages
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender?: {
    id: number;
    fullName: string | null;
    profileImage: string | null;
  };
  receiver?: {
    id: number;
    fullName: string | null;
    profileImage: string | null;
  };
}

// Export the new Conversation type from inbox types
export { Conversation, ConversationMessage } from '@/types/inbox';

interface MessagesState {
  messages: Message[];
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  socketConnected: boolean;
  currentSocket: WebSocket | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectTimeout: NodeJS.Timeout | null;
  fetchConversations: (userId: number) => Promise<void>;
  fetchMessages: (userId: number, otherId: number) => Promise<void>;
  sendMessage: (params: { senderId: number; receiverId: number; content: string }) => Promise<void>;
  markAsRead: (messageId: number) => Promise<void>;
  markAllAsRead: (userId: number) => Promise<void>;
  connectSocket: (userId: number) => void;
  disconnectSocket: () => void;
}

// Export the store directly so it can be accessed from other modules for cleanup operations
export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  conversations: [],
  loading: false,
  error: null,
  socketConnected: false,
  currentSocket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5, // Maximum reconnection attempts
  reconnectTimeout: null,

  fetchConversations: async (userId: number) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/conversations/${userId}`);
      if (!response.ok) {
        throw new Error(`Error fetching conversations: ${response.statusText}`);
      }
      const data: Conversation[] = await response.json();
      
      // Process conversations to ensure dates are properly handled
      const processedConversations = data.map(conv => ({
        ...conv,
        createdAt: typeof conv.createdAt === 'string' ? new Date(conv.createdAt) : conv.createdAt,
        lastMessage: conv.lastMessage ? {
          ...conv.lastMessage,
          createdAt: typeof conv.lastMessage.createdAt === 'string' ? new Date(conv.lastMessage.createdAt) : conv.lastMessage.createdAt
        } : null
      }));
      
      set({ conversations: processedConversations, loading: false });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations', 
        loading: false 
      });
    }
  },

  fetchMessages: async (userId: number, otherId: number) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/messages/${userId}/${otherId}`);

      if (!response.ok) {
        // Check if this is a 403 (Forbidden) due to not being connected
        if (response.status === 403) {
          throw new Error("Users must be connected to view messages");
        }

        // For other errors
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          throw new Error(errorData.error);
        } else {
          throw new Error(`Error fetching messages: ${response.statusText}`);
        }
      }

      const data = await response.json();
      set({ messages: data, loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);

      // Provide more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';

      set({ 
        error: errorMessage.includes('Users must be connected') 
          ? 'You need to connect with this user before exchanging messages'
          : errorMessage,
        loading: false 
      });
    }
  },

  sendMessage: async ({ senderId, receiverId, content }) => {
    try {
      set({ loading: true, error: null });

      // If WebSocket is connected, send the message through WebSocket
      const { currentSocket, socketConnected } = get();
      if (currentSocket && socketConnected) {
        // Create a promise that resolves when we receive a confirmation or error
        const messagePromise = new Promise((resolve, reject) => {
          // Set a timeout to reject if no response received within 5 seconds
          const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for message confirmation"));
          }, 5000);

          // Store original onmessage handler
          const originalOnMessage = currentSocket.onmessage;

          // Set temporary handler to look for our confirmation
          currentSocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              // If this is a confirmation for our message or an error
              if (data.type === 'confirmation' || data.type === 'error') {
                // Clear timeout
                clearTimeout(timeout);

                // Restore original handler
                currentSocket.onmessage = originalOnMessage;

                // If error, reject with error message
                if (data.type === 'error') {
                  reject(new Error(data.message));
                  return;
                }

                // Otherwise resolve with the confirmed message
                resolve(data.message);

                // Also process the message with the original handler
                if (originalOnMessage) {
                  originalOnMessage.call(currentSocket, event);
                }
              } else {
                // For other messages, just use the original handler
                if (originalOnMessage) {
                  originalOnMessage.call(currentSocket, event);
                }
              }
            } catch (error) {
              // For parsing errors, restore handler and reject
              currentSocket.onmessage = originalOnMessage;
              clearTimeout(timeout);
              reject(error);
            }
          };

          // Send the message
          currentSocket.send(JSON.stringify({
            senderId,
            receiverId,
            content
          }));
        });

        try {
          // Wait for confirmation or error
          await messagePromise;
          set({ loading: false });
        } catch (error) {
          console.error('WebSocket message error:', error);
          throw error; // rethrow to be caught by the outer catch
        }

        return;
      }

      // Otherwise, fall back to REST API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId,
          receiverId,
          content
        })
      });

      if (!response.ok) {
        // Try to get more detailed error
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(`Error sending message: ${response.statusText}`);
      }

      const newMessage = await response.json();

      // Update the messages and conversations state with the new message
      const { messages, conversations } = get();
      set({
        messages: [...messages, newMessage],
        loading: false
      });

      // Update conversations if applicable (only for direct messages where receiverId exists)
      if (receiverId) {
        const existingConvIndex = conversations.findIndex(
          c => c.type === 'direct' && c.otherParticipant && c.otherParticipant.id === receiverId
        );

        if (existingConvIndex !== -1) {
          const updatedConversations = [...conversations];
          updatedConversations[existingConvIndex] = {
            ...updatedConversations[existingConvIndex],
            lastMessage: newMessage as any // Type conversion for compatibility
          };
          set({ conversations: updatedConversations });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Provide a more user-friendly error message based on the error content
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        if (error.message.includes('Users must be connected')) {
          errorMessage = 'You need to connect with this user before exchanging messages';
        } else {
          errorMessage = error.message;
        }
      }

      set({ 
        error: errorMessage, 
        loading: false 
      });
    }
  },

  markAsRead: async (messageId: number) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Error marking message as read: ${response.statusText}`);
      }

      const updatedMessage = await response.json();

      // Update the message in the state
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      );

      set({ messages: updatedMessages, loading: false });
    } catch (error) {
      console.error('Error marking message as read:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to mark message as read', 
        loading: false 
      });
    }
  },

  markAllAsRead: async (userId: number) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/messages/read-all/${userId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Error marking all messages as read: ${response.statusText}`);
      }

      // Update the messages state to mark all as read
      const { messages, conversations } = get();
      const updatedMessages = messages.map(msg => 
        msg.receiverId === userId && !msg.isRead ? { ...msg, isRead: true } : msg
      );

      // Update unread counts in conversations
      const updatedConversations = conversations.map(conv => ({
        ...conv,
        unreadCount: 0
      }));

      set({ 
        messages: updatedMessages, 
        conversations: updatedConversations,
        loading: false 
      });
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to mark all messages as read', 
        loading: false 
      });
    }
  },

  connectSocket: (userId: number) => {
    const { maxReconnectAttempts, reconnectAttempts, reconnectTimeout, currentSocket, socketConnected } = get();

    // Check if we already have an active connection
    if (currentSocket && socketConnected && currentSocket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, reusing existing connection');
      return;
    }
    
    // Close any existing socket before creating a new one
    if (currentSocket) {
      console.log('Closing existing WebSocket connection before creating a new one');
      currentSocket.close();
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      set({ 
        error: 'Unable to establish connection after multiple attempts',
        loading: false 
      });
      return;
    }

    set({ loading: true });

    let wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost = window.location.host;
    // Make sure to use the exact path that the server is configured with
    const socket = new WebSocket(`${wsProtocol}//${wsHost}/ws/chat`);

    // Set a connection timeout
    const connectionTimeout = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        socket.close();
        console.log('Connection timeout, attempting reconnect...');
      }
    }, 10000);

    socket.onopen = () => {
      console.log('WebSocket connected');
      clearTimeout(connectionTimeout);
      
      // Immediately send the user ID to identify the connection
      socket.send(JSON.stringify({
        type: 'connect',
        userId: userId
      }));
      console.log('Sent connection identification with userId:', userId);
      
      set({ 
        socketConnected: true, 
        loading: false, 
        currentSocket: socket,
        reconnectAttempts: 0,
        error: null,
        reconnectTimeout: null
      });

      // Start ping interval
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(pingInterval);
        }
      }, 25000);

      socket.addEventListener('close', () => {
        clearInterval(pingInterval);
      });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // Handle ping/pong messages (keep-alive)
        if (data.type === 'ping' || data.type === 'pong') {
          // Just acknowledge ping/pong, no state change needed
          console.log(`Received ${data.type} from server`);
          return;
        }

        // Handle connection confirmation
        if (data.type === 'connected') {
          console.log('Connection confirmed:', data.message);
          set({ error: null });
          return;
        }

        // Handle confirmation messages
        if (data.type === 'confirmation') {
          console.log('Message confirmation received:', data.message);
          // Add the sent message to the state
          const { messages, conversations } = get();
          set({ messages: [...messages, data.message] });

          // Update conversations if needed
          const existingConvIndex = conversations.findIndex(
            c => c.type === 'direct' && c.otherParticipant && c.otherParticipant.id === data.message.receiverId
          );

          if (existingConvIndex !== -1) {
            const updatedConversations = [...conversations];
            updatedConversations[existingConvIndex] = {
              ...updatedConversations[existingConvIndex],
              lastMessage: data.message as any // Type conversion for compatibility
            };
            set({ conversations: updatedConversations });
          }

          return;
        }

        // Handle error messages
        if (data.type === 'error') {
          console.error('WebSocket error message:', data.message);
          set({ error: data.message });
          return;
        }

        // Handle new message (message without a type is a direct message)
        console.log('New direct message received:', data);
        const { messages, conversations, fetchConversations } = get();

        // Add the new message to the state
        set({ messages: [...messages, data] });

        // No longer call showNotification here - will be handled by component
        // Instead, emit an event that components can listen to
        document.dispatchEvent(new CustomEvent('new-message', { detail: data }));

        // Refresh conversations to show the latest message
        fetchConversations(userId);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.warn(`WebSocket closed (suppressed): ${event.code} ${event.reason}`);
      const { reconnectAttempts, maxReconnectAttempts, reconnectTimeout } = get();
      
      // Check if this is a normal closure (1000) or a user-initiated closure (1001)
      // In these cases, don't automatically reconnect
      if (event.code === 1000 || event.code === 1001) {
        console.log('WebSocket closed normally, not attempting reconnect');
        set({ 
          socketConnected: false, 
          currentSocket: null,
          reconnectAttempts: 0,
          reconnectTimeout: null
        });
        return;
      }

      if (reconnectAttempts < maxReconnectAttempts) {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        // Exponential backoff with a cap
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
        console.log(`Attempting reconnect in ${timeout}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

        // Fix variable declaration to avoid shadowing
        let newReconnectTimeout = setTimeout(() => {
          set(state => ({ 
            reconnectAttempts: state.reconnectAttempts + 1,
            socketConnected: false,
            currentSocket: null,
            error: null
          }));
          get().connectSocket(userId);
        }, timeout);

        set({ reconnectTimeout: newReconnectTimeout });
      } else {
        // Suppress error toast but still log to console
        console.warn('WebSocket closed (suppressed): max reconnect attempts reached');
        set({ 
          socketConnected: false, 
          currentSocket: null,
          reconnectAttempts: 0,
          reconnectTimeout: null
        });
      }
    };

    socket.onerror = (error) => {
      // Suppress error toast but still log to console
      console.warn('WebSocket error (suppressed):', error);
      set({ loading: false });
    };
  },

  disconnectSocket: () => {
    const { currentSocket, reconnectTimeout } = get();
    if (currentSocket) {
      console.log('Explicitly closing WebSocket connection from useMessages hook');
      // Use code 1000 (normal closure) and provide a reason
      currentSocket.close(1000, 'User logged out');
      set({ socketConnected: false, currentSocket: null, reconnectAttempts: 0, reconnectTimeout: null});
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
  }
}));

// Create a hook that returns the store's state and actions
export function useMessages() {
  return useMessagesStore();
}

export function useMessageNotifications() {
  const { toast } = useToast();
  const { user } = useUser();

  const showNotification = (message: Message) => {
    // Don't show notifications for messages sent by the current user
    if (user && message.senderId === user.id) return;

    // Construct a better title using the sender's name if available
    const senderName = message.sender?.fullName || `User ${message.senderId}`;

    toast({
      title: `New message from ${senderName}`,
      description: message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
      duration: 5000,
    });
  };

  return { showNotification };
}