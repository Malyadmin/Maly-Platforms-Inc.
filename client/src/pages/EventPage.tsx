import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserPlus2, Star, Users, CheckCircle, XCircle, Loader2, Share2, PencilIcon, MapPin, Building } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translations";
import { z } from "zod";
import { useEffect, useState } from "react";

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
  creatorUsername: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
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
            <div className="flex items-center gap-2 bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm">
              ✓ Free Event
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              👤 UserB
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

        {/* Map placeholder */}
        <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
          <p className="text-white/60">Event Location</p>
        </div>

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

      </div>
    </div>
  );
}