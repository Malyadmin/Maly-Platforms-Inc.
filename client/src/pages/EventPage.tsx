import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserPlus2, Star, Users, CheckCircle, XCircle, Loader2, Share2, PencilIcon, MapPin, Building } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/translations";
import { z } from "zod";
import { useEffect, useState } from "react";
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install uuid: npm install uuid @types/uuid
import { EventItinerary } from "@/components/EventItinerary";
import { ReferralShareButton } from "@/components/ReferralShareButton";
import { StripeCheckoutModal } from "@/components/checkout/StripeCheckoutModal";

// Define the Event type with all fields
const EventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  address: z.string().optional(),
  date: z.string().or(z.date()),
  category: z.string(),
  price: z.number().nullable(),
  image: z.string().nullable(),
  image_url: z.string().nullable(),
  attendingCount: z.number().nullable().default(0),
  interestedCount: z.number().nullable().default(0),
  creatorId: z.number().nullable(),
  creatorName: z.string().nullable(),
  creatorImage: z.string().nullable(),
  creatorUsername: z.string().nullable(), // Added creator username for profile linking
  tags: z.array(z.string()).nullable(),
  itinerary: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
      description: z.string()
    })
  ).nullable(),
  // Add attending and interested users arrays for profile linking
  attendingUsers: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      image: z.string(),
      username: z.string().optional()
    })
  ).optional().nullable(),
  interestedUsers: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      image: z.string(),
      username: z.string().optional()
    })
  ).optional().nullable(),
});

type Event = z.infer<typeof EventSchema>;

// Define participation status types
type ParticipationStatus = 'attending' | 'interested' | 'not_attending';

// Type for attendee/interested user
interface EventUser {
  id: number;
  name: string;
  image: string;
  username?: string; // Add username field for profile routing
}

// Helper function to get first name
const getFirstName = (fullName: string) => fullName?.split(' ')[0] || '';

// Load Stripe instance outside component to avoid reloading
// Ensure VITE_STRIPE_PUBLISHABLE_KEY is set in your .env file
let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("Stripe publishable key is not set in environment variables.");
      return Promise.resolve(null); // Return a promise that resolves to null
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default function EventPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const { t, language, translateEvent } = useTranslation();
  const queryClient = useQueryClient();
  const [userStatus, setUserStatus] = useState<ParticipationStatus>('not_attending');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translatedEvent, setTranslatedEvent] = useState<Event | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const { data: event, isLoading, error: queryError } = useQuery<Event>({
    queryKey: [`/api/events/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error fetching event: ${response.status}`);
      }

      return response.json();
    },
  });

  // Fetch user's participation status for this event
  const { data: participationData } = useQuery({
    queryKey: [`/api/events/${id}/participation`, user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        const response = await fetch(`/api/events/${id}/participation/status`, {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 404) {
            return { status: 'not_attending' as ParticipationStatus };
          }
          throw new Error(`Error fetching participation status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error("Error fetching participation status:", error);
        return { status: 'not_attending' as ParticipationStatus };
      }
    },
    enabled: !!user, // Only run if user is logged in
  });

  // Update user participation status when data is fetched
  useEffect(() => {
    if (participationData) {
      setUserStatus(participationData.status || 'not_attending');
    }
  }, [participationData]);
  
  // Translate event data when language changes or event data is loaded
  useEffect(() => {
    const translateEventData = async () => {
      if (event) {
        try {
          // Only translate if the language is Spanish (or any non-English language)
          if (language !== 'en') {
            console.log("Translating event data to:", language);
            const translated = await translateEvent(event, language);
            setTranslatedEvent(translated);
          } else {
            setTranslatedEvent(event); // Use original data for English
          }
        } catch (error) {
          console.error("Error translating event:", error);
          setTranslatedEvent(event); // Fallback to original event data if translation fails
        }
      }
    };
    
    translateEventData();
  }, [event, language, translateEvent]);

  const participateMutation = useMutation({
    mutationFn: async (status: ParticipationStatus) => {
      const sessionId = localStorage.getItem('maly_session_id');
      const response = await fetch(`/api/events/${id}/participate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Session-ID": sessionId || ''
        },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to update participation status");

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update local state
      setUserStatus(variables);

      // Show success message
      const messages = {
        attending: t('youAreNowAttending'),
        interested: t('youAreNowInterested'),
        not_attending: t('noLongerParticipating')
      };

      toast({
        title: "Success",
        description: messages[variables],
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/participation`, user?.id] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update participation status",
      });
    },
  });
  
  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const sessionId = localStorage.getItem('maly_session_id');
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "X-Session-ID": sessionId || ''
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete event");

      return response.json();
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      // Redirect to the events page
      setLocation('/');
      
      // Invalidate events list query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event",
      });
    },
  });

  const handleParticipate = async (status: ParticipationStatus) => {
    const sessionId = localStorage.getItem('maly_session_id');

    if (!user || !sessionId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to participate in events",
        variant: "destructive"
      });
      setLocation('/auth');
      return;
    }

    try {
      await participateMutation.mutateAsync(status);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update participation status. Please try logging in again.",
      });
      setLocation('/auth');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('maly_session_id');
      localStorage.removeItem('maly_user_data');

      // Call server logout endpoint
      await logout();

      // Clear client-side state
      queryClient.clear();

      // Redirect to auth page
      setLocation("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect to auth even if logout fails
      setLocation("/auth");
    }
  };
  
  // Function to handle event deletion with confirmation
  const handleDeleteEvent = async () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to delete events",
      });
      setLocation('/auth');
      return;
    }
    
    // Verify that the current user is the event creator
    if (user.id !== event?.creatorId) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You can only delete events you've created",
      });
      return;
    }
    
    // Ask for confirmation before deleting
    if (event && window.confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
      try {
        await deleteEventMutation.mutateAsync();
      } catch (error) {
        console.error("Delete event error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete event. Please try again.",
        });
      }
    }
  };

  // Fix for the dependency array where setLocation was added incorrectly
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_cancelled') === 'true') {
      setError('Payment was cancelled. Please try again.');
    }
  }, [id]); // Remove setLocation from dependency array since it's not used

  const handlePurchase = async () => {
    if (!event || !event.id || !user) {
        toast({ title: "Error", description: "Event details or user information missing.", variant: "destructive" });
        return;
    }
    setError(null);
    setIsProcessing(true);

    try {
        // --- Generate temporary ticket data ---
        const temporaryTicketId = uuidv4();
        const ticketDataForLocalStorage = {
            tempId: temporaryTicketId,
            eventId: event.id,
            userId: user.id, // Assuming user object is available
            eventName: event.title, // Store some display data
            timestamp: Date.now() // Add a timestamp for potential cleanup
        };
        localStorage.setItem('temp_ticket_data', JSON.stringify(ticketDataForLocalStorage));
        console.log("Stored temporary ticket data:", ticketDataForLocalStorage);
        // ------------------------------------

        // 1. Create Checkout Session on the backend
        const response = await fetch('/api/payments/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Include session ID for auth
                'x-session-id': localStorage.getItem('maly_session_id') || '' 
            },
            credentials: 'include',
            body: JSON.stringify({ eventId: event.id, quantity: 1 }), 
        });

        if (!response.ok) {
            const errorData = await response.json();
            localStorage.removeItem('temp_ticket_data'); // Clear temp data on error
            throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const { sessionId } = await response.json();

        // 2. Redirect to Stripe Checkout
        const stripe = await getStripe(); 
        if (!stripe) {
            localStorage.removeItem('temp_ticket_data'); // Clear temp data on error
            throw new Error('Stripe.js failed to load or key is missing.');
        }

        const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });

        if (stripeError) {
            console.error('Stripe redirection error:', stripeError);
            setError(stripeError.message || 'Failed to redirect to Stripe.');
            localStorage.removeItem('temp_ticket_data'); // Clear temp data on error
        }
        // If redirectToCheckout succeeds, the browser navigates away, 
        // so we don't need to clear localStorage here immediately.
    } catch (err: any) {
        console.error('Purchase error:', err);
        setError(err.message || 'An unexpected error occurred.');
        localStorage.removeItem('temp_ticket_data'); // Clear temp data on error
    } finally {
        setIsProcessing(false);
    }
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60">
        {t('loading')}
      </div>
    );
  }

  // Use the translated event data if available, otherwise use the original event data
  const displayEvent = translatedEvent || event;

  // All events are treated as public now
  const isPrivateEvent = false;
  const attendingCount = displayEvent.attendingCount || 0;
  const interestedCount = displayEvent.interestedCount || 0;

  // Use actual attendees data from the event object if available
  const attendingUsers: EventUser[] = displayEvent.attendingUsers || [];
  const interestedUsers: EventUser[] = displayEvent.interestedUsers || [];

  // Modified to support both username and ID-based profile navigation
const handleUserClick = (userIdOrUsername: number | string, username?: string) => {
  // Store current location in localStorage before navigating to profile
  // This will allow the back button to return to the event page
  try {
    localStorage.setItem('lastEventPage', window.location.pathname);
  } catch (e) {
    console.error('Failed to store last event page:', e);
  }
  
  // If we have a username directly or as a second parameter, use that
  if (typeof userIdOrUsername === 'string') {
    setLocation(`/profile/${userIdOrUsername}`);
  } else if (username) {
    setLocation(`/profile/${username}`);
  } else {
    // For backward compatibility, try to fetch the username from the database
    // This can happen during the transition period or with mock data
    console.log(`Redirecting to user profile by ID: ${userIdOrUsername}`);
    setLocation(`/profile/${userIdOrUsername}`);
  }
};

  const handleViewAllUsers = (type: 'attending' | 'interested') => {
    setLocation(`/event/${id}/users?type=${type}`);
  };

  const handleParticipationChange = async (status: ParticipationStatus) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to participate in events",
      });
      setLocation('/auth');
      return;
    }

    // Get the current session ID
    const sessionId = localStorage.getItem('maly_session_id');

    if (!sessionId) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "Please try signing in again",
      });
      setLocation('/auth');
      return;
    }

    // Toggle status if already in that state
    const newStatus = userStatus === status ? 'not_attending' : status;

    try {
      await participateMutation.mutateAsync(newStatus);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update participation status. Please try again.",
      });
    }
  };

  // Update the canPurchase check to handle string prices
  const canPurchase = 
    event.price !== null && 
    (typeof event.price === 'string' 
      ? parseFloat(event.price) > 0 
      : typeof event.price === 'number' && event.price > 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <PageHeader
        title={event.title}
        backButtonFallbackPath="/"
        className="bg-black/80 backdrop-blur-sm"
      />

      {/* Event Image */}
      {event.image && (
        <div className="container mx-auto px-2 sm:px-4 mb-4 sm:mb-6">
          <div className="rounded-lg overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full object-cover sm:object-contain max-h-[40vh] sm:max-h-[70vh]"
            />
          </div>
        </div>
      )}

      {/* Event Details */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Status Buttons or Edit Button (mobile only) */}
        <div className="sm:hidden flex flex-col gap-3 pb-4 border-b border-white/10">
          {user && user.id === event.creatorId ? (
            <>
              <h3 className="text-sm font-medium text-white/60 mb-2">Event Options</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant="default"
                  className="w-full bg-blue-700 hover:bg-blue-800"
                  onClick={() => setLocation(`/edit-event/${event.id}`)}
                  size="sm"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteEvent()}
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-white/60 mb-2">Your Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={userStatus === 'interested' ? "default" : "outline"}
                  className={`${userStatus === 'interested' ? 'bg-blue-700 hover:bg-blue-800' : ''}`}
                  onClick={() => handleParticipationChange('interested')}
                  disabled={participateMutation.isPending}
                  size="sm"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {t('interested')}
                  {userStatus === 'interested' && <CheckCircle className="h-3 w-3 ml-1" />}
                </Button>
                <Button
                  variant={userStatus === 'attending' ? "default" : "outline"}
                  className={`${userStatus === 'attending' ? 'bg-green-700 hover:bg-green-800' : ''}`}
                  onClick={() => handleParticipationChange('attending')}
                  disabled={participateMutation.isPending}
                  size="sm"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {t('attending')}
                  {userStatus === 'attending' && <CheckCircle className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Title and Meta */}
        <div className="mt-2 md:mt-0">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{event.title}</h1>
          <div className="mt-2 text-white/60 text-sm">
            <div className="flex items-center gap-1 mb-1.5">
              <span className="font-medium">{format(new Date(event.date), "EEE, MMM d")}</span>
            </div>
            <div className="flex items-center gap-1 mb-1.5">
              <span>{format(new Date(event.date), "h:mm a")} -{" "}
              {format(new Date(event.date).setHours(new Date(event.date).getHours() + 2), "h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="h-4 w-4 text-white/60" />
              <span>{event.location}</span>
            </div>
            {event.address && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-white/60" />
                <span className="text-white/80">{event.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Attendees Section */}
        <div className="flex flex-col gap-6 mt-4 sm:mt-6">
          {/* Attending Users */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60">
              {t('attending')}
            </h3>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex -space-x-2 sm:-space-x-3" onClick={() => handleViewAllUsers('attending')} style={{cursor: 'pointer'}}>
                {attendingUsers.map((user) => (
                  <Avatar 
                    key={user.id} 
                    className="ring-2 ring-background w-8 h-8 sm:w-12 sm:h-12 border-2 border-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user.username || user.id);
                    }}
                  >
                    <AvatarImage 
                      src={user.image} 
                      alt={getFirstName(user.name)}
                      className="object-cover"
                    />
                    <AvatarFallback>{getFirstName(user.name)[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {attendingCount > 5 && (
                <Button 
                  variant="ghost" 
                  className="text-xs sm:text-sm text-white/60 hover:text-white h-8 px-2 sm:px-3"
                  onClick={() => handleViewAllUsers('attending')}
                >
                  +{attendingCount - 5} more
                </Button>
              )}
            </div>
          </div>

          {/* Interested Users */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60">
              {t('interested')}
            </h3>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex -space-x-2 sm:-space-x-3" onClick={() => handleViewAllUsers('interested')} style={{cursor: 'pointer'}}>
                {interestedUsers.map((user) => (
                  <Avatar 
                    key={user.id} 
                    className="ring-2 ring-background w-8 h-8 sm:w-12 sm:h-12 border-2 border-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user.username || user.id);
                    }}
                  >
                    <AvatarImage 
                      src={user.image} 
                      alt={getFirstName(user.name)}
                      className="object-cover"
                    />
                    <AvatarFallback>{getFirstName(user.name)[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {interestedCount > 5 && (
                <Button 
                  variant="ghost" 
                  className="text-xs sm:text-sm text-white/60 hover:text-white h-8 px-2 sm:px-3"
                  onClick={() => handleViewAllUsers('interested')}
                >
                  +{interestedCount - 5} {t('more')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Event Itinerary */}
        {event.itinerary && event.itinerary.length > 0 && (
          <div className="bg-white/5 p-6 rounded-lg">
            <EventItinerary itinerary={event.itinerary} />
          </div>
        )}

        {/* Price and Registration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-white/60">{t('price')}</p>
              <p className="text-xl font-semibold">
                {event.price ? `$${event.price}` : t('free')}
              </p>
            </div>
            {/* Only show ticket/attendance buttons if not the creator */}
            {user && user.id === event.creatorId ? (
              <div className="hidden sm:block space-y-2">
                {/* Desktop edit button for event creator */}
                <Button
                  variant="default"
                  className="w-full bg-blue-700 hover:bg-blue-800 mt-4"
                  onClick={() => setLocation(`/edit-event/${event.id}`)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
                
                {/* Desktop delete button for event creator */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteEvent()}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </div>
            ) : event.price !== null && ((typeof event.price === 'string' ? parseFloat(event.price) > 0 : event.price > 0)) ? (
              <Button 
                className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 hover:from-teal-700 hover:via-blue-700 hover:to-purple-700 text-white whitespace-nowrap"
                onClick={() => setShowCheckoutModal(true)}
              >
                {t('getTickets')}
              </Button>
            ) : (
              <div className="hidden sm:flex flex-col gap-4 w-full">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  onClick={() => handleParticipate('attending')}
                  disabled={participateMutation.isPending}
                >
                  {userStatus === 'attending' ? t('imAttending') : t('illBeAttending')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => handleParticipate('interested')}
                  disabled={participateMutation.isPending}
                >
                  {userStatus === 'interested' ? t('imInterested') : t('interested')}
                </Button>
                {userStatus !== 'not_attending' && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => handleParticipate('not_attending')}
                    disabled={participateMutation.isPending}
                  >
                    {t('cancelParticipation')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Interested, Attending and Share Buttons - for tablet and desktop */}
        <div className="hidden sm:flex gap-4">
          {user && user.id !== event.creatorId && (
            <>
              <Button
                variant={userStatus === 'interested' ? "default" : "outline"}
                className={`flex-1 ${userStatus === 'interested' ? 'bg-blue-700 hover:bg-blue-800' : ''}`}
                onClick={() => handleParticipationChange('interested')}
                disabled={participateMutation.isPending}
              >
                <Star className="h-4 w-4 mr-2" />
                {userStatus === 'interested' ? `${t('interested')} ✓` : t('interested')}
              </Button>
              <Button
                variant={userStatus === 'attending' ? "default" : "outline"}
                className={`flex-1 ${userStatus === 'attending' ? 'bg-green-700 hover:bg-green-800' : ''}`}
                onClick={() => handleParticipationChange('attending')}
                disabled={participateMutation.isPending}
              >
                <Users className="h-4 w-4 mr-2" />
                {userStatus === 'attending' ? `${t('attending')} ✓` : t('attending')}
              </Button>
            </>
          )}
          
          {/* Edit Button - Only visible for event creators */}
          {user && user.id === event.creatorId && (
            <Button
              variant="outline"
              className="flex-1 whitespace-nowrap"
              onClick={() => setLocation(`/edit-event/${event.id}`)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {t('editEvent')}
            </Button>
          )}
          
          {/* Share Button - Always visible for all users */}
          <ReferralShareButton
            contentType="event"
            contentId={event.id}
            title={`Check out ${event.title} on Maly`}
            text={`${user?.fullName || user?.username || 'Someone'} has invited you to ${event.title} on Maly.`}
            variant="outline"
            className={`${user && user.id !== event.creatorId ? 'flex-none' : 'flex-1'} whitespace-nowrap max-w-fit`}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {t('share')}
          </ReferralShareButton>
        </div>
        
        {/* Mobile Share Button */}
        <div className="flex sm:hidden justify-end">
          <ReferralShareButton
            contentType="event"
            contentId={event.id}
            title={`Check out ${event.title} on Maly`}
            text={`${user?.fullName || user?.username || 'Someone'} has invited you to ${event.title} on Maly.`}
            variant="outline"
            className="whitespace-nowrap"
            size="sm"
          >
            <Share2 className="h-4 w-4 mr-1" />
            {t('share')}
          </ReferralShareButton>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('about')} this event</h2>
          <p className="text-white/80 whitespace-pre-wrap text-sm sm:text-base">
            {event.description}
          </p>
        </div>

        {/* Event Host */}
        {event.creatorId && (
          <div className="py-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar 
                  className="h-10 w-10 sm:h-12 sm:w-12"
                  onClick={() => handleUserClick(event.creatorUsername || event.creatorId as number)}
                  style={{cursor: 'pointer'}}
                >
                  <AvatarImage 
                    src={event.creatorImage || ''} 
                    alt={event.creatorName || "Event Host"}
                    className="object-cover"
                  />
                  <AvatarFallback>{(event.creatorName && getFirstName(event.creatorName)[0]) || "H"}</AvatarFallback>
                </Avatar>
                <div>
                  <div 
                    className="font-medium hover:underline cursor-pointer text-sm sm:text-base"
                    onClick={() => handleUserClick(event.creatorUsername || event.creatorId as number)}
                  >
                    {event.creatorName ? getFirstName(event.creatorName) : "Event Host"}
                  </div>
                  <div className="text-xs sm:text-sm text-white/60">{t('eventOrganizer')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display error message if exists */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm relative mb-4" role="alert">
            <span className="block">{error}</span>
          </div>
        )}

        {/* Add Purchase Button - only show on desktop/tablet */ 
        /* (mobile uses bottom fixed button) */}
        {/* Don't show the purchase button if user is the event creator */}
        {canPurchase && user && user.id !== event.creatorId && (
          <div className="mt-4 hidden sm:block">
            <Button
              className="w-full mt-4 font-semibold"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Purchase Ticket {event.price ? `($${typeof event.price === 'string' ? parseFloat(event.price).toFixed(2) : event.price.toFixed(2)})` : ''}
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Add spacing at the bottom for mobile to account for fixed bottom button */}
        {user && (
          // For regular users viewing a paid event
          (user.id !== event.creatorId && event.price) || 
          // Or for event creators (to account for the Edit button)
          (user.id === event.creatorId)
        ) && (
          <div className="h-20 sm:h-0"></div>
        )}
      </div>

      {/* Bottom Actions - Mobile */}
      {user && (
        user.id === event.creatorId ? (
          // Actions for Event Host (Mobile)
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/90 backdrop-blur-lg border-t border-white/10 z-10 sm:hidden">
            <div className="container mx-auto grid grid-cols-2 gap-2">
              <Button
                className="h-12 text-sm sm:text-base rounded-lg bg-blue-700 hover:bg-blue-800"
                onClick={() => setLocation(`/edit-event/${event.id}`)}
                disabled={false}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
              <Button
                className="h-12 text-sm sm:text-base rounded-lg"
                variant="destructive"
                onClick={() => handleDeleteEvent()}
                disabled={false}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </div>
          </div>
        ) : event.price ? (
          // Get Tickets Button for Regular Users (Mobile)
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/90 backdrop-blur-lg border-t border-white/10 z-10 sm:hidden">
            <div className="container mx-auto">
              <Button
                className="w-full h-12 text-sm sm:text-base rounded-lg bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 hover:from-teal-700 hover:via-blue-700 hover:to-purple-700"
                onClick={() => setShowCheckoutModal(true)}
                disabled={participateMutation.isPending}
              >
                {`${t('illBeAttending')}${event.price && parseFloat(event.price.toString()) > 0 ? ` • $${event.price}` : ''}`}
              </Button>
            </div>
          </div>
        ) : null
      )}

      {/* Stripe Checkout Modal */}
      {showCheckoutModal && event && (
        <StripeCheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          event={event}
          onSuccess={() => {
            setShowCheckoutModal(false);
            toast({
              title: "Ticket Purchased!",
              description: "Your ticket has been purchased successfully.",
            });
            // Refresh the event data to update attendance counts
            queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
          }}
        />
      )}
    </div>
  );
}