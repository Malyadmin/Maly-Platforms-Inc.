import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, MapPin, Mail, Briefcase, Calendar, UserPlus, Check, X, UserCheck, Smile, Heart, Edit3, UserCircle, Share2, ChevronDown, Inbox } from "lucide-react";
import { ReferralShareButton } from "@/components/ReferralShareButton";
import { useTranslation } from "@/lib/translations";
import PremiumPaywall from "@/components/PremiumPaywall";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VIBE_AND_MOOD_TAGS } from "@/lib/constants";

// Mood badge styles configuration
const moodStyles = {
  // New vibe and mood tags
  "Party & Nightlife": "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  "Fashion & Style": "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30",
  "Networking & Business": "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  "Dining & Drinks": "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  "Outdoor & Nature": "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
  "Wellness & Fitness": "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30",
  "Creative & Artsy": "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30",
  "Single & Social": "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30",
  "Chill & Recharge": "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30",
  "Adventure & Exploring": "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
  "Spiritual & Intentional": "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
  
  // Keep legacy styles for backward compatibility
  "Dating": "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30",
  "Networking": "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  "Parties": "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  "Adventure": "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
  "Dining Out": "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  "Working": "bg-slate-500/20 text-slate-500 hover:bg-slate-500/30",
  "Exploring": "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
  "Learning": "bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30",
  "Teaching": "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
  "Socializing": "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30",
  "Focusing": "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30",
  "Relaxing": "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30",
  "Creating": "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30"
} as const;

interface ProfileData {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  birthLocation: string | null;
  nextLocation: string | null;
  interests: string[];
  currentMoods?: string[] | null;
  profession: string | null;
  age: number | null;
  gender: string | null;
  sexualOrientation: string | null;
}

interface ConnectionStatus {
  outgoing: {
    status: string;
    date: string;
  } | null;
  incoming: {
    status: string;
    date: string;
  } | null;
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { username } = useParams();
  const { user: currentUser } = useUser();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  
  // Available moods for selection
  const moods = VIBE_AND_MOOD_TAGS;
  
  // If we're at /profile (without a username), we want to show the current user's profile
  // And redirect to /profile/{username} for proper routing
  useEffect(() => {
    if (!username && currentUser?.username) {
      setLocation(`/profile/${currentUser.username}`);
    }
  }, [username, currentUser, setLocation]);

  // Get the connection status between current user and profile user
  const {
    data: connectionStatus,
    isLoading: connectionLoading,
  } = useQuery<ConnectionStatus>({
    queryKey: ['connection-status', profileData?.id, currentUser?.id],
    queryFn: async () => {
      if (!profileData?.id || !currentUser?.id) {
        return { outgoing: null, incoming: null };
      }
      const response = await fetch(`/api/connections/status/${profileData.id}`);
      if (!response.ok) throw new Error('Failed to fetch connection status');
      return response.json();
    },
    enabled: !!profileData?.id && !!currentUser?.id,
  });

  // Create a connection request
  const createConnectionMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send connection request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Connection request sent',
        description: 'Your connection request has been sent successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['connection-status', profileData?.id, currentUser?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error sending request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Accept a connection request
  const respondToConnectionMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: 'accepted' | 'declined' }) => {
      const response = await fetch(`/api/connections/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${status} connection request`);
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === 'accepted' ? 'Connection accepted' : 'Connection declined',
        description: variables.status === 'accepted' 
          ? 'You are now connected with this user.' 
          : 'You have declined this connection request.',
      });
      queryClient.invalidateQueries({ queryKey: ['connection-status', profileData?.id, currentUser?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle message button click - check premium status first
  const handleMessageClick = () => {
    if (!profileData) return;
    
    if (currentUser?.isPremium) {
      createConversationMutation.mutate(profileData.id);
    } else {
      setShowPremiumPaywall(true);
    }
  };

  // Create or find a conversation with another user
  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Navigate to the conversation page with the conversation ID
      if (data?.id) {
        setLocation(`/chat/conversation/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error starting conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update mood mutation
  const updateMoodMutation = useMutation({
    mutationFn: async (mood: string) => {
      console.log('⚠️ Updating mood with:', mood ? [mood] : []);
      console.log('⚠️ Sending POST request to /api/profile');
      
      try {
        const response = await fetch('/api/profile', {
          method: 'POST', // Changed from PATCH to POST to match server endpoint
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include cookies for auth
          body: JSON.stringify({ 
            currentMoods: mood ? [mood] : [] 
          }),
        });
        
        if (!response.ok) {
          // Fix for HTML error response handling
          try {
            const errorText = await response.text();
            console.log('⚠️ Error response text:', errorText.substring(0, 500) + '...');
            
            // Check if response is HTML (typical for redirect to login page)
            if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
              throw new Error('Authentication error. Please log in again.');
            }
            
            // Try to parse as JSON if not HTML
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Failed to update mood');
          } catch (e: any) {
            // If JSON parsing fails or any other error
            if (e.message === 'Authentication error. Please log in again.') {
              throw e;
            }
            throw new Error(`Error updating mood: ${response.status} ${response.statusText}`);
          }
        }
        
        const responseData = await response.json();
        console.log('⚠️ Mood update successful, received:', responseData);
        return responseData;
      } catch (error) {
        console.error('⚠️ Error in mood update function:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Mood updated',
        description: 'Your mood has been updated successfully.',
      });
      
      // Update the profile data locally
      if (profileData) {
        setProfileData({
          ...profileData,
          currentMoods: data.currentMoods
        });
      }
      
      // Close the mood selector
      setIsUpdatingMood(false);
      
      // Invalidate any queries that depend on user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating mood',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    // Scroll to top when the profile page is loaded/changed
    window.scrollTo(0, 0);
    
    const fetchProfileData = async () => {
      try {
        // If we have no username to look up, use the current user data directly
        if (!username && currentUser) {
          setProfileData(currentUser as ProfileData);
          setLoading(false);
          return;
        }
        
        // Otherwise fetch the profile from the API
        if (username) {
          // Check if username is a numeric ID
          const isNumericId = /^\d+$/.test(username);
          let endpoint = '';
          
          if (isNumericId) {
            // Fetch by user ID directly
            console.log(`Fetching user profile by ID: ${username}`);
            endpoint = `/api/users/${username}`;
          } else {
            // Fetch by username
            console.log(`Fetching user profile by username: ${username}`);
            endpoint = `/api/users/username/${username}`;
          }
          
          const response = await fetch(endpoint);
          if (!response.ok) {
            console.error(`Failed to fetch profile data: ${response.status}`);
            throw new Error('Failed to fetch profile data');
          }
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username || currentUser) {
      fetchProfileData();
    }
  }, [username, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return <div>Profile not found</div>;
  }
  
  // Handle back button click
  const handleBack = () => {
    window.history.back();
  };

  return (
<div className="min-h-screen bg-black">
  {/* Header - Sticky */}
  <div className="sticky top-0 left-0 right-0 z-20 bg-black border-b border-gray-800">
    {/* MALY logo and inbox icon row */}
    <div className="flex items-center justify-between px-5 pt-3 pb-2">
      <img 
        src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
        alt="MÁLY" 
        className="h-14 w-auto"
      />
      <button
        className="p-2 hover:bg-white/10 rounded-lg"
        onClick={() => setLocation("/inbox")}
        data-testid="button-inbox-header"
      >
        <Inbox className="h-7 w-7" style={{ color: 'white', stroke: 'white' }} />
      </button>
    </div>
    
    {/* Profile title with gradient - uppercase with extra letter spacing */}
    <div className="px-5 pb-3">
      <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>Profile</h2>
    </div>
  </div>

  {/* Fullscreen Profile Image with Name Overlay on Left */}
  <div className="relative w-full h-screen">
    {profileData.profileImage ? (
      <div className="absolute inset-0">
        <img 
          src={profileData.profileImage} 
          alt={profileData.fullName || profileData.username}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>
    ) : (
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-blue-900/80 to-black/90 flex items-center justify-center">
        <div className="text-9xl font-bold text-white/20">
          {profileData.username[0].toUpperCase()}
        </div>
      </div>
    )}
    
    {/* Name and Location overlay - absolute positioned at bottom */}
    <div className="absolute bottom-6 left-0 right-0 px-6 z-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {profileData.fullName || profileData.username}
        </h1>
        
        {profileData.location && (
          <p className="text-white text-base">
            {t(profileData.location)}
          </p>
        )}
      </div>
      
      {/* Three vibes */}
      {profileData.currentMoods && profileData.currentMoods.length > 0 && (
        <div className="flex items-center justify-between gap-4 mt-4">
          <div className="flex-1 text-white text-sm">
            {profileData.currentMoods[0]}
          </div>
          {profileData.currentMoods.length > 1 && (
            <div className="flex-1 text-center text-white text-sm">
              {profileData.currentMoods[1]}
            </div>
          )}
          {profileData.currentMoods.length > 2 && (
            <div className="flex-1 text-right text-white text-sm flex items-center justify-end gap-1">
              {profileData.currentMoods[2]}
              {profileData.currentMoods.length > 3 && (
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>

  {/* Scrollable Content Section */}
  <div className="bg-black">
    <div className="container mx-auto px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* All Vibes Section */}
        {profileData.currentMoods && profileData.currentMoods.length > 0 && (
          <div className="space-y-3">
            {profileData.currentMoods.map((mood, index) => (
              <p key={`mood-${index}`} className="text-white text-base">
                {t(mood)}
              </p>
            ))}
          </div>
        )}
        
        {/* Location Details - Line by Line */}
        <div className="space-y-3 pt-4">
          {profileData.birthLocation && (
            <p className="text-white text-base">
              {language === 'es' ? 'Nacido en' : 'Born in'} {t(profileData.birthLocation)}
            </p>
          )}
          {profileData.location && (
            <p className="text-white text-base">
              {language === 'es' ? 'Vive en' : 'Lives in'} {t(profileData.location)}
            </p>
          )}
          {profileData.nextLocation && (
            <p className="text-white text-base">
              {language === 'es' ? 'Próximo destino' : 'Upcoming'} {t(profileData.nextLocation)}
            </p>
          )}
        </div>
        
        {/* Action Buttons */}
        {currentUser && profileData.id !== currentUser.id && (
          <div className="space-y-3 pt-6">
            {/* Message Button - Always shown */}
            <Button 
              onClick={handleMessageClick}
              disabled={createConversationMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full border-0"
              data-testid="button-message"
            >
              {createConversationMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Message
            </Button>
            
            {/* Connect and Share Row */}
            <div className="flex gap-3">
              {/* Connect Button */}
              {connectionLoading ? (
                <Button disabled className="flex-1 bg-gray-700 text-white rounded-full border-0">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading
                </Button>
              ) : connectionStatus?.outgoing?.status === 'accepted' || connectionStatus?.incoming?.status === 'accepted' ? (
                <Button className="flex-1 bg-green-600 text-white rounded-full border-0" disabled>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Connected
                </Button>
              ) : connectionStatus?.outgoing?.status === 'pending' ? (
                <Button className="flex-1 bg-yellow-600 text-white rounded-full border-0" disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pending
                </Button>
              ) : connectionStatus?.incoming?.status === 'pending' ? (
                <>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full border-0"
                    onClick={() => respondToConnectionMutation.mutate({ 
                      userId: profileData.id, 
                      status: 'accepted' 
                    })}
                    disabled={respondToConnectionMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full border-0"
                    onClick={() => respondToConnectionMutation.mutate({ 
                      userId: profileData.id, 
                      status: 'declined' 
                    })}
                    disabled={respondToConnectionMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => createConnectionMutation.mutate(profileData.id)}
                  disabled={createConnectionMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full border-0"
                >
                  {createConnectionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {t('connectProfile')}
                </Button>
              )}
              
              {/* Share Button */}
              <ReferralShareButton
                contentType="profile"
                contentId={profileData.username || profileData.id}
                title={`Check out ${profileData.fullName || profileData.username}'s profile on Maly`}
                text={`${currentUser?.fullName || currentUser?.username || 'Someone'} has invited you to connect with ${profileData.fullName || profileData.username} on Maly.`}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-full border-0"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </ReferralShareButton>
            </div>
          </div>
        )}
        
        {/* Edit Profile buttons for own profile */}
        {currentUser && profileData.id === currentUser.id && (
          <div className="space-y-3 pt-6">
            <Button 
              className="w-full bg-white/20 hover:bg-white/30 text-white rounded-full border-0"
              onClick={() => setLocation('/profile-edit')}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {t('editProfile')}
            </Button>
            <Button 
              className="w-full bg-white/20 hover:bg-white/30 text-white rounded-full border-0"
              onClick={() => setLocation('/stripe/connect')}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Payment Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Premium Paywall for Messaging */}
  <PremiumPaywall
    isOpen={showPremiumPaywall}
    onClose={() => setShowPremiumPaywall(false)}
    feature="messaging"
  />
</div>
);
}