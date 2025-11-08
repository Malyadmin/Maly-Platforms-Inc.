import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";

import { MessageSquare, UserPlus2, Star, Users, CheckCircle, XCircle, Loader2, Share2, PencilIcon, MapPin, Building, CreditCard, Lock, Bookmark, ChevronRight } from "lucide-react";

import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translations";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Define the Event type with all fields
const TicketTierSchema = z.object({
  id: z.number(),
  eventId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.string(),
  quantity: z.number().nullable(),
  isActive: z.boolean(),
});

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
  dressCode: z.string().nullable().optional(),
  creator: z.object({
    id: z.number(),
    username: z.string(),
    fullName: z.string(),
    profileImage: z.string().nullable(),
  }).nullable(),
  ticketTiers: z.array(TicketTierSchema).optional(),
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
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [showAllVibes, setShowAllVibes] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showDressCode, setShowDressCode] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Purchase ticket mutation
  const purchaseTicketMutation = useMutation({
    mutationFn: async ({ eventId, quantity = 1, ticketTierId }: { eventId: number; quantity?: number; ticketTierId?: number }) => {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          quantity,
          ticketTierId,
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
    <div className="h-screen flex flex-col overflow-hidden bg-black text-white">
      {/* Header - Fixed at top */}
      <header className="bg-black text-white shrink-0 z-50">
        {/* Top bar with MÁLY logo */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        {/* Bottom bar with Back button and Discover title */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/discover')}
              className="text-white/80 hover:text-white transition-colors text-sm"
              data-testid="button-back-to-discover"
            >
              Back
            </button>
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>Discover</h2>
          </div>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Large Event Image */}
        {event.image && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Details */}
      <div className="px-5 py-4 space-y-4">
        {/* Event Title */}
        <h1 className="text-xl font-semibold text-white">{event.title}</h1>
        
        {/* Hosted by */}
        <button
          onClick={() => event?.creator?.username && setLocation(`/profile/${event.creator.username}`)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          data-testid="event-creator-link"
        >
          {event?.creator?.profileImage ? (
            <img
              src={event.creator.profileImage}
              alt={event.creator.fullName}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-white text-xs">{event?.creator?.fullName?.charAt(0) || event?.creator?.username?.charAt(0)}</span>
            </div>
          )}
          <span className="text-sm text-white/80">Hosted by {event?.creator?.fullName || event?.creator?.username || 'Unknown Host'}</span>
        </button>

        {/* Date, Time, Price, Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white">{format(new Date(event.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-white">
              {(() => {
                if (event.ticketTiers && event.ticketTiers.length > 0) {
                  const hasPaidTiers = event.ticketTiers.some(tier => parseFloat(tier.price) > 0);
                  if (hasPaidTiers) {
                    const minPrice = Math.min(...event.ticketTiers.map(tier => parseFloat(tier.price)));
                    const maxPrice = Math.max(...event.ticketTiers.map(tier => parseFloat(tier.price)));
                    return minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
                  } else {
                    return "Free";
                  }
                } else if (event.ticketType === 'paid' && event.price && parseFloat(event.price) > 0) {
                  return `$${event.price}`;
                } else {
                  return "Free";
                }
              })()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/60" />
            <p className="text-sm text-white/80">{event.address || event.location}</p>
          </div>
        </div>

        {/* Mapbox Map */}
        {event.latitude != null && event.longitude != null ? (
          <div 
            ref={mapContainer} 
            className="h-48 w-full rounded-lg"
          />
        ) : (
          <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
            <p className="text-sm text-white/60">Location coordinates not available</p>
          </div>
        )}

        {/* Vibes - Show 3, expand with > */}
        {event.tags && event.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {(showAllVibes ? event.tags : event.tags.slice(0, 3)).map((tag, index) => (
                <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-xs">
                  {tag}
                </span>
              ))}
              {event.tags.length > 3 && (
                <button
                  onClick={() => setShowAllVibes(!showAllVibes)}
                  className="flex items-center gap-1 text-white/80 hover:text-white text-xs"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${showAllVibes ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dress Code - Collapsible */}
        {event.dressCode && (
          <div className="space-y-2">
            <button
              onClick={() => setShowDressCode(!showDressCode)}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
            >
              <span>Dress Code</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showDressCode ? 'rotate-90' : ''}`} />
            </button>
            {showDressCode && (
              <p className="text-sm text-white/80 pl-6">{event.dressCode}</p>
            )}
          </div>
        )}

        {/* Description Preview */}
        <div className="space-y-2">
          <p className={`text-sm text-white/80 leading-relaxed ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {event.description}
          </p>
          {event.description && event.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-sm text-white hover:underline"
            >
              {showFullDescription ? 'View Less' : 'View More'}
            </button>
          )}
        </div>


        {/* Ticket CTA, Share, and Save Button */}
        {user && event.creatorId !== user.id && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              {/* Ticket/Purchase Button */}
              {event.ticketType === 'paid' || (event.ticketTiers && event.ticketTiers.length > 0) ? (
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm py-2 px-6"
                  onClick={() => setIsTicketModalOpen(true)}
                  data-testid="button-purchase-ticket"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Get Tickets
                </Button>
              ) : event.requireApproval ? (
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm py-2 px-6"
                  onClick={() => accessRequestMutation.mutate()}
                  disabled={accessRequestMutation.isPending}
                  data-testid="button-request-access"
                >
                  {accessRequestMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Request
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm py-2 px-6"
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
                      Attending
                    </>
                  ) : (
                    "RSVP"
                  )}
                </Button>
              )}
              
              {/* Share Button */}
              <Button 
                variant="outline" 
                className="border-gray-600 text-white hover:bg-gray-800 px-4"
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: event.title,
                        text: `Check out this event: ${event.title}`,
                        url: window.location.href,
                      });
                    } catch (err) {
                      if ((err as Error).name !== 'AbortError') {
                        console.error('Error sharing:', err);
                        toast({
                          title: "Share failed",
                          description: "Unable to share this event",
                          variant: "destructive",
                        });
                      }
                    }
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link copied!",
                      description: "Event link copied to clipboard",
                    });
                  }
                }}
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              
              {/* Save Button */}
              <Button 
                variant="outline" 
                className={`px-4 ${
                  participationStatus?.status === 'interested'
                    ? 'bg-purple-600/20 border-purple-600 text-purple-400 hover:bg-purple-600/30'
                    : 'border-gray-600 text-white hover:bg-gray-800'
                }`}
                onClick={() => participateMutation.mutate(
                  participationStatus?.status === 'interested' ? 'not_participating' : 'interested'
                )}
                disabled={participateMutation.isPending}
                data-testid="button-interested"
              >
                <Bookmark className={`w-5 h-5 ${participationStatus?.status === 'interested' ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        )}

        {/* Counts - Attending (left) and Interested (right) */}
        <div className="flex items-center justify-between text-white/60 text-xs pt-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{event.attendingCount || 0} Attending</span>
          </div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            <span>{event.interestedCount || 0} Interested</span>
          </div>
        </div>

      </div>

      {/* Ticket Selection Modal */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Select Your Ticket</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {event.ticketTiers && event.ticketTiers.length > 0 ? (
              <>
                {event.ticketTiers.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedTierId === tier.id
                        ? 'border-purple-500 bg-purple-600/20 ring-2 ring-purple-500/50'
                        : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-purple-400/10'
                    }`}
                    data-testid={`modal-ticket-tier-${tier.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-semibold text-lg">{tier.name}</h4>
                        {tier.description && (
                          <p className="text-gray-300 text-sm mt-1">{tier.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">${parseFloat(tier.price).toFixed(2)}</div>
                        {tier.quantity && (
                          <div className="text-gray-400 text-xs">{tier.quantity} available</div>
                        )}
                      </div>
                    </div>
                    {selectedTierId === tier.id && (
                      <div className="flex items-center gap-2 text-purple-300 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Selected</span>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsTicketModalOpen(false)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    data-testid="button-cancel-modal"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedTierId) {
                        setIsTicketModalOpen(false);
                        purchaseTicketMutation.mutate({ eventId: event.id, ticketTierId: selectedTierId });
                      }
                    }}
                    disabled={!selectedTierId || purchaseTicketMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50"
                    data-testid="button-confirm-purchase"
                  >
                    {purchaseTicketMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : selectedTierId ? (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase
                      </>
                    ) : (
                      'Select a ticket'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">No ticket tiers available for this event.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
      {/* Scrollable content area end */}
    </div>
  );
}