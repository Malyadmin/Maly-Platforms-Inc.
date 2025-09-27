import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, MapPin, Mail, Briefcase, Calendar, UserPlus, Check, X, UserCheck, Smile, Heart, Edit3, UserCircle, Share2, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ReferralShareButton } from "@/components/ReferralShareButton";
import { useTranslation } from "@/lib/translations";
import PremiumPaywall from "@/components/PremiumPaywall";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
  {/* Header */}
  <div className="absolute top-0 left-0 right-0 z-20 py-4 border-b border-gray-800 bg-black/80 backdrop-blur-sm">
    {/* MALY logo centered at top */}
    <div className="flex justify-center pb-3">
      <img 
        src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
        alt="MÁLY" 
        className="h-8 w-auto"
      />
    </div>
    
    {/* Profile title on left */}
    <div className="px-5">
      <h2 className="text-white text-lg font-medium">Profile</h2>
    </div>
  </div>

  {/* Fullscreen Profile Image with Overlay */}
  <div className="relative w-full h-screen">
    {profileData.profileImage ? (
      <div className="absolute inset-0">
        <img 
          src={profileData.profileImage} 
          alt={profileData.fullName || profileData.username}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
      </div>
    ) : (
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-blue-900/80 to-black/90 flex items-center justify-center">
        <div className="text-9xl font-bold text-white/20">
          {profileData.username[0].toUpperCase()}
        </div>
      </div>
    )}
    
    {/* Profile info overlay at bottom */}
    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {profileData.fullName || profileData.username}
        </h1>
        
        <div className="flex flex-wrap gap-2">
          {profileData.location && (
            <Badge className="bg-white/20 hover:bg-white/30 text-white py-2 px-3 text-sm backdrop-blur-sm border-0">
              <MapPin className="h-4 w-4 mr-2" />
              {t(profileData.location)}
            </Badge>
          )}
          
          {profileData.profession && (
            <Badge className="bg-white/20 hover:bg-white/30 text-white py-2 px-3 text-sm backdrop-blur-sm border-0">
              <Briefcase className="h-4 w-4 mr-2" />
              {t(profileData.profession)}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Edit Profile button - only show if viewing own profile */}
        {currentUser && profileData.id === currentUser.id && (
          <>
            <Button 
              variant="secondary"
              className="gap-2 bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30"
              onClick={() => setLocation('/profile-edit')}
            >
              <Edit3 className="h-4 w-4" />
              {t('editProfile')}
            </Button>
            <Button 
              variant="secondary"
              className="gap-2 bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30"
              onClick={() => setLocation('/stripe/connect')}
            >
              <Briefcase className="h-4 w-4" />
              Payment Settings
            </Button>
          </>
        )}
        
        {/* Share Profile Button - always visible */}
        <ReferralShareButton
          contentType="profile"
          contentId={profileData.username || profileData.id}
          title={`Check out ${profileData.fullName || profileData.username}'s profile on Maly`}
          text={`${currentUser?.fullName || currentUser?.username || 'Someone'} has invited you to connect with ${profileData.fullName || profileData.username} on Maly.`}
          variant="secondary"
          className="gap-2 bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30"
        >
          <Share2 className="h-4 w-4" />
          {t('shareProfile')}
        </ReferralShareButton>
        
        {/* Connection Button - only show if viewing profile of other user and user is logged in */}
        {currentUser && profileData.id !== currentUser.id && (
          <div className="w-full sm:w-auto">
            {connectionLoading ? (
              <Button disabled className="w-full sm:w-auto bg-white/20 backdrop-blur-sm text-white border-0">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading
              </Button>
            ) : connectionStatus?.outgoing?.status === 'accepted' || connectionStatus?.incoming?.status === 'accepted' ? (
              <div className="flex gap-2 w-full">
                <Button variant="secondary" className="gap-2 bg-green-500/30 backdrop-blur-sm text-white border-0 flex-1 sm:flex-auto" disabled>
                  <UserCheck className="h-4 w-4" />
                  Connected
                </Button>
                <Button 
                  onClick={handleMessageClick}
                  disabled={createConversationMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex-1 sm:flex-auto rounded-full border-0"
                  data-testid="button-message"
                >
                  {createConversationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Message
                </Button>
              </div>
            ) : connectionStatus?.outgoing?.status === 'pending' ? (
              <Button variant="secondary" className="gap-2 bg-yellow-500/30 backdrop-blur-sm text-white border-0 w-full sm:w-auto" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                Request Pending
              </Button>
            ) : connectionStatus?.incoming?.status === 'pending' ? (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="default" 
                  className="gap-1 bg-green-600 hover:bg-green-700 flex-1 sm:flex-auto border-0"
                  onClick={() => respondToConnectionMutation.mutate({ 
                    userId: profileData.id, 
                    status: 'accepted' 
                  })}
                  disabled={respondToConnectionMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
                <Button 
                  variant="secondary" 
                  className="gap-1 bg-red-500/30 backdrop-blur-sm text-white border-0 hover:bg-red-500/40 flex-1 sm:flex-auto"
                  onClick={() => respondToConnectionMutation.mutate({ 
                    userId: profileData.id, 
                    status: 'declined' 
                  })}
                  disabled={respondToConnectionMutation.isPending}
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => createConnectionMutation.mutate(profileData.id)}
                disabled={createConnectionMutation.isPending}
                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto rounded-full border-0"
              >
                {createConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {t('connectProfile')}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* More Info Button */}
      <Button 
        onClick={() => setShowMoreInfo(!showMoreInfo)}
        variant="secondary"
        className="w-full gap-2 bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30"
      >
        {showMoreInfo ? 'Less Info' : 'More Info'}
        <ChevronDown className={`h-4 w-4 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  </div>

  {/* Collapsible More Info Section */}
  {showMoreInfo && (
    <div className="bg-black/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Personal Info Section */}
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6">
            {/* Bio */}
            {profileData.bio && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">About</h3>
                <p className="text-base text-white/80">{profileData.bio}</p>
              </div>
            )}
            
            {/* Personal Details */}
            <div className="space-y-6">
              {/* Gender & Sexual Orientation */}
              {(profileData.gender || profileData.sexualOrientation) && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Personal</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.gender && (
                      <Badge className="bg-white/20 text-white py-2 px-3 text-sm border-0">
                        Gender: {profileData.gender}
                      </Badge>
                    )}
                    {profileData.sexualOrientation && (
                      <Badge className="bg-white/20 text-white py-2 px-3 text-sm border-0">
                        Orientation: {profileData.sexualOrientation}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Locations */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">{t('viewLocations')}</h3>
                <div className="space-y-3">
                  {profileData.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-white/80">{language === 'es' ? 'Actualmente en' : 'Currently in'} <span className="font-medium text-white">{t(profileData.location)}</span></span>
                    </div>
                  )}
                  {profileData.birthLocation && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <span className="text-white/80">{language === 'es' ? 'Nacido en' : 'Born in'} <span className="font-medium text-white">{t(profileData.birthLocation)}</span></span>
                    </div>
                  )}
                  {profileData.nextLocation && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-green-400" />
                      <span className="text-white/80">{language === 'es' ? 'Próximo destino' : 'Going to'} <span className="font-medium text-white">{t(profileData.nextLocation)}</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mood & Vibe Section */}
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-white">{t('moodAndVibe')}</h3>
              </div>
              
              {/* Only show change mood button if viewing own profile */}
              {currentUser && profileData.id === currentUser.id && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="gap-1 text-xs text-white bg-white/10 rounded-full h-8 px-3"
                  onClick={() => setIsUpdatingMood(!isUpdatingMood)}
                  disabled={updateMoodMutation.isPending}
                >
                  {updateMoodMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Edit3 className="h-3 w-3" />
                  )}
                  {isUpdatingMood ? "Cancel" : (profileData.currentMoods?.length ? "Change" : "Add")}
                </Button>
              )}
            </div>
            
            {/* Mood & Vibe Display */}
            {!isUpdatingMood ? (
              <div>
                {((profileData.currentMoods && profileData.currentMoods.length > 0) || (profileData.interests && profileData.interests.length > 0)) ? (
                  <div className="flex flex-wrap gap-2">
                    {/* First display currentMoods if available */}
                    {profileData.currentMoods && profileData.currentMoods.length > 0 ? 
                      profileData.currentMoods.map((mood, index) => (
                        <Badge 
                          key={`mood-${index}`}
                          className={`py-2 px-3 text-sm font-medium border-0 ${moodStyles[mood as keyof typeof moodStyles] || 'bg-white/20 text-white'} rounded-full`}
                        >
                          {t(mood)}
                        </Badge>
                      ))
                    : 
                      /* Otherwise fall back to interests for backward compatibility */
                      profileData.interests && profileData.interests.map((interest, index) => (
                        <Badge 
                          key={`interest-${index}`}
                          className={`py-2 px-3 text-sm font-medium border-0 ${moodStyles[interest as keyof typeof moodStyles] || 'bg-white/20 text-white'} rounded-full`}
                        >
                          {t(interest)}
                        </Badge>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-white/60 text-sm italic">
                    {currentUser && profileData.id === currentUser.id 
                      ? "You haven't shared your mood & vibe preferences yet."
                      : "This user hasn't shared their mood & vibe preferences yet."}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-black/40 rounded-xl p-4 space-y-3">
                <p className="text-sm text-white/60">Select your mood & vibe preferences:</p>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <Button
                      key={mood}
                      variant="outline"
                      size="sm"
                      className={`
                        border-0 rounded-full px-3 py-1 h-auto text-xs text-white bg-white/20 hover:bg-white/30
                        ${moodStyles[mood as keyof typeof moodStyles] || ''}
                      `}
                      onClick={() => updateMoodMutation.mutate(mood)}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interests Section - Only show if they have interests separate from moods */}
          {profileData.interests && profileData.interests.length > 0 && (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-white">{t('interests')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, index) => (
                  <Badge key={index} className="bg-white/20 text-white py-2 px-3 text-sm border-0 rounded-full">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* Premium Paywall for Messaging */}
  <PremiumPaywall
    isOpen={showPremiumPaywall}
    onClose={() => setShowPremiumPaywall(false)}
    feature="messaging"
  />
</div>
);
}