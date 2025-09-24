import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserPlus2, Star, Users, CheckCircle, XCircle, Loader2, Share2, PencilIcon, MapPin, Building, CreditCard } from "lucide-react";
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

        {/* Purchase Ticket Button - Only show for paid events */}
        {event.ticketType === 'paid' && event.price && parseFloat(event.price) > 0 && user && (
          <div className="pt-6 border-t border-white/10">
            <Button
              onClick={() => purchaseTicketMutation.mutate({ eventId: event.id })}
              disabled={purchaseTicketMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 text-lg"
              data-testid="purchase-ticket-button"
            >
              {purchaseTicketMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Purchase Ticket - ${event.price}
                </>
              )}
            </Button>
            {!user && (
              <p className="text-white/60 text-sm text-center mt-2">
                Please log in to purchase tickets
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}