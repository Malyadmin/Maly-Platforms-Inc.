import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, MapPin, Mail, Briefcase, Calendar, UserPlus, Check, X, UserCheck, Smile, Heart, Edit3, UserCircle, Share, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ReferralShareButton } from "@/components/ReferralShareButton";
import { useTranslation } from "@/lib/translations";
import PremiumPaywall from "@/components/PremiumPaywall";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VIBE_AND_MOOD_TAGS, formatIntentionLabel } from "@/lib/constants";
import { BottomNav } from "@/components/ui/bottom-nav";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";

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
  profileImages?: string[];
  bio: string | null;
  location: string | null;
  birthLocation: string | null;
  livedLocation: string | null;
  nextLocation: string | null;
  interests: string[];
  currentMoods?: string[] | null;
  profession: string | null;
  age: number | null;
  gender: string | null;
  sexualOrientation: string | null;
  intention: string | string[] | null;
  isPremium?: boolean;
}


export default function ProfilePage() {
  const [location, setLocation] = useLocation();
  const { username } = useParams();
  const { user: currentUser, logout } = useUser();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const fromUrl = searchParams.get('from');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [shareClicked, setShareClicked] = useState(false);
  const [messageClicked, setMessageClicked] = useState(false);
  const [currentProfileImageIndex, setCurrentProfileImageIndex] = useState(0);
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

  // Check if user is in contacts (one-way check)
  const {
    data: isContact,
    isLoading: connectionLoading,
  } = useQuery<boolean>({
    queryKey: ['contact-check', profileData?.id, currentUser?.id],
    queryFn: async () => {
      if (!profileData?.id || !currentUser?.id) {
        return false;
      }
      const response = await fetch(`/api/contacts/check/${profileData.id}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.isContact || false;
    },
    enabled: !!profileData?.id && !!currentUser?.id,
  });

  // Add contact (one-way, instant, no approval needed)
  const createConnectionMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactUserId: targetUserId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add contact');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact added',
        description: "They've been added to your contacts.",
      });
      queryClient.invalidateQueries({ queryKey: ['contact-check', profileData?.id, currentUser?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove contact
  const removeConnectionMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch(`/api/contacts/${targetUserId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove contact');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact removed',
        description: "They've been removed from your contacts.",
      });
      queryClient.invalidateQueries({ queryKey: ['contact-check', profileData?.id, currentUser?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing contact',
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

  useEffect(() => {
    setCurrentProfileImageIndex(0);
  }, [profileData?.id]);

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

  return (
<div className="h-screen flex flex-col overflow-hidden bg-black">
  {/* Header - Fixed at top */}
  <header className="bg-background text-foreground shrink-0 z-50">
    {/* Top bar with MÁLY logo and hamburger menu */}
    <div className="flex items-center justify-between px-5 pt-3 pb-2">
      <img 
        src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
        alt="MÁLY" 
        className="h-14 w-auto"
      />
      <HamburgerMenu />
    </div>
    
    {/* Profile title with gradient - uppercase with extra letter spacing */}
    <div className="px-5 pb-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 sm:space-y-3">
          <div>
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
              {profileData?.id === currentUser?.id ? 'P R O F I L E' : 'C O N N E C T'}
            </h2>
            {profileData?.location && (
              <p className="text-white text-sm mt-1">{profileData.location}</p>
            )}
          </div>
          <button
            onClick={() => {
              if (fromUrl) {
                setLocation(fromUrl);
              } else if (window.history.length > 1) {
                window.history.back();
              } else {
                setLocation("/discover");
              }
            }}
            className="text-white/80 hover:text-white transition-colors text-sm"
            data-testid="button-back"
          >
            Back
          </button>
        </div>
        {currentUser && profileData?.id !== currentUser?.id && (
          <button
            onClick={async () => {
              setShareClicked(true);
              const shareUrl = `${window.location.origin}/profile/${profileData.username || profileData.id}`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: `Check out ${profileData.fullName || profileData.username}'s profile on Maly`,
                    text: `${currentUser?.fullName || currentUser?.username || 'Someone'} has invited you to connect with ${profileData.fullName || profileData.username} on Maly.`,
                    url: shareUrl,
                  });
                } catch (err) {
                  console.error('Share failed:', err);
                }
              } else {
                await navigator.clipboard.writeText(shareUrl);
                toast({
                  title: 'Link copied',
                  description: 'Profile link copied to clipboard',
                });
              }
            }}
            className="p-0 bg-transparent border-0 transition-colors hover:opacity-80"
          >
            <Share 
              className="h-6 w-6" 
              strokeWidth={2.5}
              color={shareClicked ? '#9333ea' : '#9ca3af'}
            />
          </button>
        )}
      </div>
    </div>
  </header>

  {/* Scrollable content area */}
  <div className="flex-1 overflow-y-auto" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
    {/* Fullscreen Profile Image with Name Overlay on Left */}
    <div className="relative w-full h-screen">
    {(() => {
      const profileImages = profileData.profileImages?.length > 0 
        ? profileData.profileImages 
        : profileData.profileImage 
        ? [profileData.profileImage] 
        : [];
      
      const currentImage = profileImages[currentProfileImageIndex];
      
      return currentImage ? (
        <div className="absolute inset-0">
          <img 
            src={currentImage} 
            alt={profileData.fullName || profileData.username}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
          
          {profileImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentProfileImageIndex((prev) => 
                  prev > 0 ? prev - 1 : profileImages.length - 1
                )}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 dark:bg-black/50 hover:bg-background/70 rounded-full transition-colors"
                data-testid="button-profile-image-prev"
              >
                <ChevronLeft className="h-6 w-6 text-foreground" />
              </button>
              <button
                onClick={() => setCurrentProfileImageIndex((prev) => 
                  prev < profileImages.length - 1 ? prev + 1 : 0
                )}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 dark:bg-black/50 hover:bg-background/70 rounded-full transition-colors"
                data-testid="button-profile-image-next"
              >
                <ChevronRight className="h-6 w-6 text-foreground" />
              </button>
              <div className="absolute top-4 right-4 px-3 py-1 bg-background/60 rounded-full text-foreground text-sm" data-testid="image-counter">
                {currentProfileImageIndex + 1} / {profileImages.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-blue-900/80 to-black/90 flex items-center justify-center">
          <div className="text-9xl font-bold text-foreground/20">
            {profileData.username[0].toUpperCase()}
          </div>
        </div>
      );
    })()}
    
    {/* Name and Location overlay - absolute positioned at bottom with more space */}
    <div className="absolute bottom-32 left-0 right-0 px-6 z-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <span>{profileData.fullName || profileData.username}</span>
          {profileData.isPremium && (
            <img 
              src="/attached_assets/IMG_0425_1762623366264.jpeg" 
              alt="Premium" 
              className="w-6 h-6 flex-shrink-0"
            />
          )}
        </h1>
        
        {profileData.location && (
          <p className="text-foreground text-base">
            {t(profileData.location)}
          </p>
        )}
      </div>
    </div>
  </div>

  {/* Scrollable Content Section */}
  <div className="bg-black">
    <div className="container mx-auto px-6 py-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Info - Labeled Fields */}
        <div className="space-y-4">
          {/* Occupation */}
          {profileData.profession && (
            <div>
              <p className="text-foreground/60 text-sm">Occupation</p>
              <p className="text-foreground text-base mt-1">{profileData.profession}</p>
            </div>
          )}
          
          {/* Bio */}
          {profileData.bio && (
            <div className="space-y-2">
              <p className="text-foreground/60 text-sm">Bio</p>
              <p className={`text-foreground text-base mt-1 ${showFullBio ? '' : 'line-clamp-2'}`}>{profileData.bio}</p>
              {profileData.bio.length > 100 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-sm text-purple-400 hover:underline"
                >
                  {showFullBio ? 'View Less' : 'View More'}
                </button>
              )}
            </div>
          )}
          
          {/* Vibe */}
          {profileData.currentMoods && profileData.currentMoods.length > 0 && (
            <div>
              <p className="text-foreground/60 text-sm">Vibe</p>
              <p className="text-foreground text-base mt-1">{profileData.currentMoods.join(', ')}</p>
            </div>
          )}
          
          {/* Intention */}
          {profileData.intention && (
            <div>
              <p className="text-foreground/60 text-sm">Intention</p>
              <p className="text-foreground text-base mt-1">
                {formatIntentionLabel(profileData.intention)}
              </p>
            </div>
          )}
          
          {/* Born */}
          {profileData.birthLocation && (
            <div>
              <p className="text-foreground/60 text-sm">Born</p>
              <p className="text-foreground text-base mt-1">{t(profileData.birthLocation)}</p>
            </div>
          )}
          
          {/* Lived */}
          {profileData.livedLocation && (
            <div>
              <p className="text-foreground/60 text-sm">Lived</p>
              <p className="text-foreground text-base mt-1">{t(profileData.livedLocation)}</p>
            </div>
          )}
          
          {/* Upcoming */}
          {profileData.nextLocation && (
            <div>
              <p className="text-foreground/60 text-sm">Upcoming</p>
              <p className="text-foreground text-base mt-1">{t(profileData.nextLocation)}</p>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        {currentUser && profileData.id !== currentUser.id && (
          <div className="space-y-3 pt-6 pb-24">
            {/* Message Button - Always shown */}
            <button
              onClick={() => {
                setMessageClicked(true);
                handleMessageClick();
              }}
              disabled={createConversationMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20 text-sm font-medium py-2.5 px-4 transition-all disabled:opacity-50"
              data-testid="button-message"
            >
              {createConversationMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Message
            </button>
            
            {/* Connect Button */}
            {connectionLoading ? (
              <button disabled className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 text-white text-sm font-medium py-2.5 px-4 opacity-50">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading
              </button>
            ) : isContact ? (
              <button 
                onClick={() => removeConnectionMutation.mutate(profileData.id)}
                disabled={removeConnectionMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20 text-sm font-medium py-2.5 px-4 transition-all disabled:opacity-50"
                data-testid="button-remove-contact"
              >
                {removeConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                In Contacts
              </button>
            ) : (
              <button
                onClick={() => createConnectionMutation.mutate(profileData.id)}
                disabled={createConnectionMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20 text-sm font-medium py-2.5 px-4 transition-all disabled:opacity-50"
                data-testid="button-add-contact"
              >
                {createConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Add to Contacts
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  </div>
  {/* Scrollable content area end */}

  {/* Premium Paywall for Messaging */}
  <PremiumPaywall
    isOpen={showPremiumPaywall}
    onClose={() => setShowPremiumPaywall(false)}
    feature="messaging"
  />
  
  {/* Bottom Navigation */}
  <BottomNav />
</div>
);
}