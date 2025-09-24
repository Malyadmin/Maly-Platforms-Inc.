import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, MapPin, Mail, Briefcase, Calendar, UserPlus, Check, X, UserCheck, Smile, Heart, Edit3, UserCircle, Share2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ReferralShareButton } from "@/components/ReferralShareButton";
import { useTranslation } from "@/lib/translations";

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
  {/* Header with back button */}
  <div className="sticky top-0 z-10 bg-black/70 backdrop-blur-sm border-b border-border">
    <div className="container mx-auto px-4 py-4">
      <Button
        variant="ghost"
        className="text-white"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </div>
  </div>


      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Profile Card with Image */}
          <Card className="overflow-hidden border-border/30 bg-black/30 mb-6">
            <div className="min-h-[300px] max-h-[500px] relative">
              {profileData.profileImage ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden py-4">
                  <img 
                    src={profileData.profileImage} 
                    alt={profileData.fullName || profileData.username}
                    className="max-h-[450px] max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80"></div>
                </div>
              ) : (
                <div className="min-h-[300px] w-full bg-gradient-to-b from-purple-900/80 via-blue-900/80 to-black/90 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white/20">
                    {profileData.username[0].toUpperCase()}
                  </div>
                </div>
              )}
              
              {/* Profile info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                  {profileData.fullName || profileData.username}
                  {/* Age is now hidden in profile display as requested */}
                </h1>
                
                <div className="flex flex-wrap gap-2">
                  {profileData.location && (
                    <Badge className="bg-white/10 hover:bg-white/20 text-white py-1 px-2 text-xs backdrop-blur-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {t(profileData.location)}
                    </Badge>
                  )}
                  
                  {profileData.profession && (
                    <Badge className="bg-white/10 hover:bg-white/20 text-white py-1 px-2 text-xs backdrop-blur-sm">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {t(profileData.profession)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="p-4 border-t border-border/20">
              <div className="flex flex-wrap gap-3">
                {/* Edit Profile button - only show if viewing own profile */}
                {currentUser && profileData.id === currentUser.id && (
                  <>
                    <Button 
                      variant="outline"
                      className="gap-2 border-primary/30 hover:border-primary"
                      onClick={() => setLocation('/profile-edit')}
                    >
                      <Edit3 className="h-4 w-4" />
                      {t('editProfile')}
                    </Button>
                    <Button 
                      variant="outline"
                      className="gap-2 border-green-500/30 hover:border-green-500 text-green-400"
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
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  {t('shareProfile')}
                </ReferralShareButton>
                
                {/* Connection Button - only show if viewing profile of other user and user is logged in */}
                {currentUser && profileData.id !== currentUser.id && (
                  <div className="w-full sm:w-auto">
                    {connectionLoading ? (
                      <Button disabled className="w-full sm:w-auto">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading
                      </Button>
                    ) : connectionStatus?.outgoing?.status === 'accepted' || connectionStatus?.incoming?.status === 'accepted' ? (
                      <Button variant="outline" className="gap-2 border-green-500/30 text-green-500 w-full sm:w-auto" disabled>
                        <UserCheck className="h-4 w-4" />
                        Connected
                      </Button>
                    ) : connectionStatus?.outgoing?.status === 'pending' ? (
                      <Button variant="outline" className="gap-2 border-yellow-500/30 text-yellow-500 w-full sm:w-auto" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Request Pending
                      </Button>
                    ) : connectionStatus?.incoming?.status === 'pending' ? (
                      <div className="flex gap-2 w-full">
                        <Button 
                          variant="default" 
                          className="gap-1 bg-green-600 hover:bg-green-700 flex-1 sm:flex-auto"
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
                          variant="outline" 
                          className="gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10 flex-1 sm:flex-auto"
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
                        className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto rounded-full"
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
            </div>
          </Card>
          
          {/* Personal Info Section */}
          <Card className="mb-6 bg-black/30 border-border/30 overflow-hidden rounded-xl">
            <CardContent className="p-4">
              {/* Bio */}
              {profileData.bio && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
                  <p className="text-base text-foreground/90">{profileData.bio}</p>
                </div>
              )}
              
              {/* Personal Details */}
              <div className="space-y-4">
                {/* Gender & Sexual Orientation */}
                {(profileData.gender || profileData.sexualOrientation) && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Personal</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.gender && (
                        <Badge variant="outline" className="py-1 px-2 text-xs">
                          Gender: {profileData.gender}
                        </Badge>
                      )}
                      {profileData.sexualOrientation && (
                        <Badge variant="outline" className="py-1 px-2 text-xs">
                          Orientation: {profileData.sexualOrientation}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Locations */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('viewLocations')}</h3>
                  <div className="space-y-2">
                    {profileData.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{language === 'es' ? 'Actualmente en' : 'Currently in'} <span className="font-medium">{t(profileData.location)}</span></span>
                      </div>
                    )}
                    {profileData.birthLocation && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-blue-400" />
                        <span>{language === 'es' ? 'Nacido en' : 'Born in'} <span className="font-medium">{t(profileData.birthLocation)}</span></span>
                      </div>
                    )}
                    {profileData.nextLocation && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-green-400" />
                        <span>{language === 'es' ? 'Próximo destino' : 'Going to'} <span className="font-medium">{t(profileData.nextLocation)}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Mood & Vibe Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">{t('moodAndVibe')}</h2>
              </div>
              
              {/* Only show change mood button if viewing own profile */}
              {currentUser && profileData.id === currentUser.id && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="gap-1 text-xs text-primary h-7 px-2"
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
              <div className="bg-black/20 rounded-xl p-4 border border-border/20">
                {((profileData.currentMoods && profileData.currentMoods.length > 0) || (profileData.interests && profileData.interests.length > 0)) ? (
                  <div className="flex flex-wrap gap-2">
                    {/* First display currentMoods if available */}
                    {profileData.currentMoods && profileData.currentMoods.length > 0 ? 
                      profileData.currentMoods.map((mood, index) => (
                        <Badge 
                          key={`mood-${index}`}
                          className={`py-1.5 px-3 text-sm font-medium ${moodStyles[mood as keyof typeof moodStyles] || ''} rounded-full`}
                        >
                          {t(mood)}
                        </Badge>
                      ))
                    : 
                      /* Otherwise fall back to interests for backward compatibility */
                      profileData.interests && profileData.interests.map((interest, index) => (
                        <Badge 
                          key={`interest-${index}`}
                          className={`py-1.5 px-3 text-sm font-medium ${moodStyles[interest as keyof typeof moodStyles] || ''} rounded-full`}
                        >
                          {t(interest)}
                        </Badge>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    {currentUser && profileData.id === currentUser.id 
                      ? "You haven't shared your mood & vibe preferences yet."
                      : "This user hasn't shared their mood & vibe preferences yet."}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-black/20 rounded-xl p-4 border border-border/20 space-y-3">
                <p className="text-xs text-muted-foreground">Select your mood & vibe preferences:</p>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <Button
                      key={mood}
                      variant="outline"
                      size="sm"
                      className={`
                        border rounded-full px-3 py-1 h-auto text-xs
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
          
          {/* We removed the duplicate Mood & Vibe section (previously called "Interests") */}
        </div>
      </div>
    </div>
  );
}