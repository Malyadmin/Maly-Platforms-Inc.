import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from "@db/schema";

interface UserResponse extends User {
  connections?: Array<{
    id: number;
    username: string;
    fullName: string;
    profileImage: string | null;
    status?: string;
  }>;
}

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: any
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }
      const message = await response.text();
      return { ok: false, message };
    }

    // For login and authentication endpoints, capture the session ID if returned
    if (url === '/api/login' || url === '/api/register' || url === '/api/auth/check') {
      try {
        const data = await response.json();
        
        // If the response contains a sessionId, store it in localStorage
        if (data && data.sessionId) {
          console.log("Storing session ID from server response:", data.sessionId);
          localStorage.setItem('maly_session_id', data.sessionId);
        }
        
        // Store user data if included in the response
        if (data && data.user) {
          localStorage.setItem('maly_user_data', JSON.stringify(data.user));
          // Store userId separately for direct access
          if (data.user.id) {
            console.log("Storing user ID for auth:", data.user.id);
            localStorage.setItem('maly_user_id', data.user.id.toString());
          }
        }
        
        return { ok: true };
      } catch (parseError) {
        console.warn("Error parsing JSON response:", parseError);
        return { ok: true }; // Still succeed even if parsing fails
      }
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  // Check if there's a session parameter in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');
  
  // If we have a sessionId in the URL, clean it up by removing that parameter
  // and store it in localStorage for persistence across webview issues
  if (sessionId) {
    console.log("Detected session parameter, storing in localStorage and refreshing user data");
    
    // Store the session in localStorage for persistence
    localStorage.setItem('maly_session_id', sessionId);
    
    // Create a clean URL without the sessionId parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('sessionId');
    url.searchParams.delete('ts');
    
    // Replace the URL without reloading the page to remove sessionId from browser history
    window.history.replaceState({}, document.title, url.toString());
  }

  // Retrieve stored session ID from localStorage if it exists
  const storedSessionId = localStorage.getItem('maly_session_id');
  
  // Check for cached user data in localStorage
  const getCachedUser = (): UserResponse | null => {
    try {
      const cachedUserJson = localStorage.getItem('maly_user_data');
      if (cachedUserJson) {
        return JSON.parse(cachedUserJson);
      }
      return null;
    } catch (error) {
      console.error("Error parsing cached user data:", error);
      return null;
    }
  };

  const { data: user, error, isLoading, refetch } = useQuery<UserResponse>({
    queryKey: ['user'],
    queryFn: async () => {
      console.log("Fetching user data from server, sessionId present:", !!(sessionId || storedSessionId));
      
      // Check for cached user data first to minimize API calls
      const cachedUser = getCachedUser();
      
      // If we have a cached user and we're not forcing a refresh with sessionId, 
      // use it without making an API call
      if (cachedUser && !sessionId && !window.location.pathname.startsWith('/auth')) {
        console.log("Using cached user data without verification");
        // Only verify the cached user once every 5 minutes
        const lastVerified = localStorage.getItem('maly_user_verified_at');
        const now = Date.now();
        
        if (!lastVerified || now - parseInt(lastVerified, 10) > 5 * 60 * 1000) {
          // Schedule verification in the background but don't wait for it
          setTimeout(async () => {
            try {
              const verifyResponse = await fetch('/api/verify-user', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: cachedUser.id })
              });
              
              if (verifyResponse.ok) {
                localStorage.setItem('maly_user_verified_at', now.toString());
              } else if (verifyResponse.status === 404) {
                // User no longer exists, clear all cached data and stop retrying
                console.log("User no longer exists, clearing cached data and stopping verification");
                localStorage.removeItem('maly_user_data');
                localStorage.removeItem('maly_user_id');
                localStorage.removeItem('maly_session_id');
                // Set a flag to prevent further verification attempts
                localStorage.setItem('maly_user_verified_at', (Date.now() + 86400000).toString()); // 24 hours in future
                queryClient.invalidateQueries({ queryKey: ['user'] });
              } else {
                // Other verification failures - mark as verified to stop retrying  
                localStorage.setItem('maly_user_verified_at', now.toString());
              }
            } catch (error) {
              console.error("Background verification error:", error);
            }
          }, 100);
        }
        
        return cachedUser;
      }
      
      // If we need to fetch, prepare headers
      const extraHeaders: Record<string, string> = {};

      // Add user ID if available (primary auth method)
      const userId = localStorage.getItem('maly_user_id');
      if (userId) {
        console.log("Including user ID in auth check:", userId);
        extraHeaders['X-User-ID'] = userId;
      }

      // Add session ID as fallback
      const malySessionId = localStorage.getItem('maly_session_id');
      if (malySessionId) {
        console.log("Including maly_session_id in auth check:", malySessionId.substring(0, 5) + '...');
        extraHeaders['X-Session-ID'] = malySessionId;
      } else if (storedSessionId) {
        console.log("Including storedSessionId in auth check:", storedSessionId.substring(0, 5) + '...');
        extraHeaders['X-Session-ID'] = storedSessionId;
      }

      // Check auth status with the dedicated endpoint
      try {
        const authCheckResponse = await fetch('/api/auth/check', {
          credentials: 'include',
          headers: extraHeaders
        });
        
        if (!authCheckResponse.ok) {
          console.error("Auth check failed:", authCheckResponse.status);
          return cachedUser || null;
        }
        
        const authStatus = await authCheckResponse.json();
        
        // If authenticated, use the user data
        if (authStatus.authenticated && authStatus.user) {
          console.log("User authenticated via auth check:", authStatus.user.username);
          localStorage.setItem('maly_user_data', JSON.stringify(authStatus.user));
          localStorage.setItem('maly_user_verified_at', Date.now().toString());
          return authStatus.user;
        }
        
        // If not authenticated via cookies, try stored session ID
        if (!authStatus.authenticated && storedSessionId) {
          console.log("Cookie auth failed, trying stored session ID");
          
          const response = await fetch('/api/user-by-session', {
            credentials: 'include',
            headers: { 
              'X-Session-ID': storedSessionId
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData) {
              console.log("User authenticated via stored session ID:", userData.username);
              localStorage.setItem('maly_user_data', JSON.stringify(userData));
              localStorage.setItem('maly_user_verified_at', Date.now().toString());
              return userData;
            }
          }
        }
        
        // Not authenticated and no valid session
        if (cachedUser) {
          // Clear cached data as server rejected authentication
          localStorage.removeItem('maly_user_data');
          localStorage.removeItem('maly_session_id');
          localStorage.removeItem('maly_user_verified_at');
        }
        
        return null;
      } catch (error) {
        console.error("Auth check error:", error);
        // On network errors, fall back to cached user data
        return cachedUser || null;
      }
    },
    // Much more conservative refresh settings to reduce API calls
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
    refetchOnWindowFocus: false, 
    refetchOnMount: false, // Only fetch when explicitly needed
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
    enabled: true
  });

  const login = useMutation({
    mutationFn: async (userData: any) => {
      const result = await handleRequest('/api/login', 'POST', userData);
      if (result.ok) {
        // Force a refetch immediately after successful login
        await refetch();
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const register = useMutation({
    mutationFn: async (userData: any) => {
      const result = await handleRequest('/api/register', 'POST', userData);
      if (result.ok) {
        // Force a refetch immediately after successful registration
        await refetch();
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logout = useMutation({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      // Clear user data immediately
      queryClient.setQueryData(['user'], null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Disconnect any active WebSocket connection
      try {
        // Disconnect using the global WebSocket service first
        const websocketModule = require('../services/websocket');
        if (websocketModule && websocketModule.disconnectWebSocket) {
          websocketModule.disconnectWebSocket();
          console.log("Disconnected WebSocket from websocket service");
        }
        
        // Then disconnect using the useMessages hook if needed
        const messagesModule = require('./use-messages');
        if (messagesModule && messagesModule.useMessagesStore) {
          messagesModule.useMessagesStore.getState().disconnectSocket();
          console.log("Disconnected WebSocket from useMessagesStore");
        }
      } catch (error) {
        console.error("Error disconnecting WebSockets:", error);
      }
      
      // Clear ALL localStorage cached data related to user session
      localStorage.removeItem('maly_user_data');
      localStorage.removeItem('maly_session_id');
      localStorage.removeItem('maly_user_id');
      localStorage.removeItem('maly_user_verified_at');
      localStorage.removeItem('sessionId');
      
      // Remove any other potential cached data
      localStorage.removeItem('connect.sid');
      localStorage.removeItem('maly_session');
      
      console.log("Cleared all cached user data on logout");
      
      // Force a page reload to ensure a clean state
      window.location.href = '/auth';
    },
  });

  const startChat = async (userId: number) => {
    if (!user) return '/auth';
    return `/chat/${userId}`;
  };

  // Dedicated method to refresh user data and return the updated user
  const refreshUser = async (): Promise<UserResponse | null> => {
    try {
      console.log("Explicitly refreshing user data");
      // Force invalidate the cache first
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Then explicitly refetch
      const { data } = await refetch();
      console.log("User data refreshed successfully:", data);
      
      return data || null;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
  };
  
  // Immediately refresh user data if we have a sessionId in the URL
  if (sessionId) {
    refreshUser();
  }

  // Add profile update mutation
  const updateProfile = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${errorText}`);
      }
      
      // Parse the updated user response
      const updatedUser = await response.json();
      
      // Update localStorage cache with the fresh user data
      if (updatedUser) {
        localStorage.setItem('maly_user_data', JSON.stringify(updatedUser));
      }
      
      return { ok: true, user: updatedUser };
    },
    onSuccess: (data) => {
      // Update the React Query cache with our updated user
      if (data.user) {
        queryClient.setQueryData(['user'], data.user);
      }
      
      // Then invalidate to make sure any components using the data are refreshed
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: login.mutateAsync,
    logout: logout.mutateAsync,
    register: register.mutateAsync,
    startChat,
    refetchUser: refetch,
    refreshUser,
    updateProfile: updateProfile.mutateAsync
  };
}