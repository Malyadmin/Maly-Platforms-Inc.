import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";

import { MessageSquare, UserPlus2, Star, Users, CheckCircle, XCircle, Loader2, Share2, PencilIcon, MapPin, Building, CreditCard, Lock } from "lucide-react";

import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translations";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
// Define the Event type with all fields
const EventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  address: z.string().optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  date: z.string().or(z.date()),
  category: z.string(),
  price: z.string().nullable(),
  ticketType: z.string().nullable(),
  image: z.string().nullable(),
  image_url: z.string().nullable(),
  attendingCount: z.number().nullable().default(0),
  interestedCount: z.number().nullable().default(0),
  creatorId: z.number().nullable(),
  tags: z.array(z.string()).nullable(),
  isPrivate: z.boolean().optional(),
  isRsvp: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  creator: z.object({
    id: z.number(),
    username: z.string(),
    fullName: z.string(),
    profileImage: z.string().nullable(),
  }).nullable(),
});

type Event = z.infer<typeof EventSchema>;

export default function EventPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const { t, language, translateEvent } = useTranslation();
  const queryClient = useQueryClient();
  const [translatedEvent, setTranslatedEvent] = useState<Event | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Purchase ticket mutation
  const purchaseTicketMutation = useMutation({
    mutationFn: async ({ eventId, quantity = 1 }: { eventId: number; quantity?: number }) => {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          quantity,
          userId: user?.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      console.error("Purchase ticket error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate ticket purchase. Please try again.",
        variant: "destructive",
      });
    }
  });

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

  // Get current participation status for public events
  const { data: participationStatus } = useQuery({
    queryKey: [`/api/events/${id}/participation/status`],
    enabled: !!user && !!event && !event.isPrivate && !event.isRsvp, // Only check for public events
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}/participation/status`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch participation status');
      return response.json();
    },
  });

  // Get current RSVP status for approval-required events
  const { data: rsvpStatus } = useQuery({
    queryKey: [`/api/events/${id}/rsvp/status`],
    enabled: !!user && !!event && (event.isPrivate || event.isRsvp || event.requireApproval), // Only for approval events
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}/applications/${user?.id}`, {
        credentials: 'include'
      });
      if (response.status === 404) return null; // No application found
      if (!response.ok) throw new Error('Failed to fetch RSVP status');
      return response.json();
    },
  });

  // Mutation for regular event participation
  const participateMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/events/${id}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update participation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/participation/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      toast({
        title: "Success",
        description: "Successfully updated participation status",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update participation status",
      });
    },
  });

  // Mutation for private event access requests
  const accessRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${id}/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send access request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Access Request Sent",
        description: "Your request has been sent to the event host for approval",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send access request",
      });
    },
  });

  // Translate event data when language changes or event data is loaded
  useEffect(() => {
    const translateEventData = async () => {
      if (event) {
        try {
          if (language !== 'en') {
            console.log("Translating event data to:", language);
            const translated = await translateEvent(event, language);
            setTranslatedEvent(translated);
          } else {
            setTranslatedEvent(event);
          }
        } catch (error) {
          console.error("Error translating event:", error);
          setTranslatedEvent(event);
        }
      }
    };
    
    translateEventData();
  }, [event, language, translateEvent]);

  // Initialize Mapbox map when event data is available
  useEffect(() => {
    if (!event || !mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.warn('VITE_MAPBOX_ACCESS_TOKEN not found, map will not be displayed');
      return;
    }

    // Only initialize if we have coordinates (allow zero values)
    if (event.latitude != null && event.longitude != null) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [event.longitude, event.latitude],
        zoom: 14
      });

      // Add marker at event location
      new mapboxgl.Marker({ color: '#8B5CF6' })
        .setLngLat([event.longitude, event.latitude])
        .addTo(map.current);

      // Clean up on unmount
      return () => {
        map.current?.remove();
      };
    }
  }, [event]);

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60">
        {t('loading')}
      </div>
    );
  }

  const displayEvent = translatedEvent || event;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* iOS-style Header with Close and Share */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setLocation('/discover')}
            className="text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm"
          >
            Close
          </button>
          <button className="text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
            Share
          </button>
        </div>
      </div>

      {/* Large Event Image */}
      {event.image && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* MÁLY logo overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/30 px-8 py-4 rounded-lg backdrop-blur-sm">
              <h1 className="text-white text-3xl font-bold tracking-[0.3em]" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>MÁLY</h1>
            </div>
          </div>
        </div>
      )}

      {/* Event Details */}
      <div className="px-6 py-8 space-y-8">
        {/* Event Title */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <div className="flex items-center gap-4 mb-4">
            {event.ticketType === 'paid' && event.price && parseFloat(event.price) > 0 ? (
              <div className="flex items-center gap-2 bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                💳 ${event.price}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm">
                ✓ Free Event
              </div>
            )}
            <div className="flex items-center gap-2 text-blue-400">
              <button
                onClick={() => event?.creator?.username && setLocation(`/profile/${event.creator.username}`)}
                className="flex items-center gap-2 hover:underline cursor-pointer"
                data-testid="event-creator-link"
              >
                {event?.creator?.profileImage ? (
                  <img
                    src={event.creator.profileImage}
                    alt={event.creator.fullName}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <span>👤</span>
                )}
                <span>{event?.creator?.fullName || event?.creator?.username || 'Unknown Host'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-white">
            <span className="text-lg">📅</span>
            <div>
              <h3 className="text-white font-semibold">Date & Time</h3>
              <p className="text-white text-lg font-medium">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>
              <p className="text-white/70">{format(new Date(event.date), "h:mm a")}</p>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-white">
            <span className="text-lg">✈️</span>
            <div>
              <h3 className="text-white font-semibold">Location</h3>
              <p className="text-white text-lg font-medium">{event.location}</p>
              <p className="text-white/70">{event.address || event.location}</p>
            </div>
          </div>
        </div>

        {/* Mapbox Map */}
        {event.latitude != null && event.longitude != null ? (
          <div 
            ref={mapContainer} 
            className="h-48 w-full rounded-lg"
            style={{ minHeight: '300px' }}
          />
        ) : (
          <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
            <p className="text-white/60">Location coordinates not available</p>
          </div>
        )}

        {/* About This Event Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-white">
            <span className="text-lg">☰</span>
            <h3 className="text-white font-semibold">About This Event</h3>
          </div>
          <p className="text-white/80 leading-relaxed">{event.description}</p>
        </div>

        {/* Event Vibes Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white">
            <span className="text-lg">✨</span>
            <h3 className="text-white font-semibold">Event Vibes</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {event.tags?.map((tag, index) => (
              <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            )) || (
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                Wellness & Movement
              </span>
            )}
          </div>
        </div>

        {/* Participation Section */}
        {user && event.creatorId !== user.id && (
          <div className="pt-4 space-y-4">
            {event.requireApproval ? (
              /* RSVP/Private Event - Show Request Access Button or Status */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">This event requires host approval to attend</span>
                </div>
                
                {/* Show current RSVP status if user has one */}
                {rsvpStatus?.status ? (
                  <div className="space-y-3">
                    {rsvpStatus.status === 'pending_approval' || rsvpStatus.status === 'pending_access' ? (
                      <div className="flex items-center gap-2 text-orange-400 bg-orange-400/10 px-4 py-2 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Your request is pending approval</span>
                      </div>
                    ) : rsvpStatus.status === 'attending' ? (
                      <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">You are attending this event</span>
                      </div>
                    ) : rsvpStatus.status === 'rejected' ? (
                      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Your request was declined</span>
                      </div>
                    ) : rsvpStatus.status === 'interested' ? (
                      <div className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-4 py-2 rounded-lg">
                        <Star className="w-4 h-4" />
                        <span className="text-sm">You are interested in this event</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* Show request button if no status */
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    onClick={() => accessRequestMutation.mutate()}
                    disabled={accessRequestMutation.isPending}
                    data-testid="button-request-access"
                  >
                    {accessRequestMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Request Access
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              /* Public Event - Show Regular Participation Buttons */
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{event.attendingCount || 0} attending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>{event.interestedCount || 0} interested</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* Purchase button for paid events */}
                  {event.ticketType === 'paid' && event.price && parseFloat(event.price) > 0 && (
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      onClick={() => purchaseTicketMutation.mutate({ eventId: event.id })}
                      disabled={purchaseTicketMutation.isPending}
                      data-testid="button-purchase-ticket"
                    >
                      {purchaseTicketMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Purchase Ticket - ${event.price}
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    className={`w-full ${
                      participationStatus?.status === 'attending' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    } text-white`}
                    onClick={() => participateMutation.mutate(
                      participationStatus?.status === 'attending' ? 'not_participating' : 'attending'
                    )}
                    disabled={participateMutation.isPending}
                    data-testid="button-attending"
                  >
                    {participateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : participationStatus?.status === 'attending' ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Cancel Attendance
                      </>
                    ) : (
                      "I'll be attending"
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`w-full ${
                      participationStatus?.status === 'interested'
                        ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400 hover:bg-yellow-600/30'
                        : 'border-gray-600 text-white hover:bg-gray-800'
                    }`}
                    onClick={() => participateMutation.mutate(
                      participationStatus?.status === 'interested' ? 'not_participating' : 'interested'
                    )}
                    disabled={participateMutation.isPending}
                    data-testid="button-interested"
                  >
                    {participateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : participationStatus?.status === 'interested' ? (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        No longer interested
                      </>
                    ) : (
                      "I'm interested"
                    )}
                  </Button>
                </div>
              </div>

            )}
          </div>
        )}

      </div>
    </div>
  );
}