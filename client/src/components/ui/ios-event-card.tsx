import { format } from "date-fns";
import { useLocation } from "wouter";
import { Lock } from "lucide-react";

interface Event {
  id: number;
  title: string;
  date: string;
  location?: string;
  price?: string;
  image?: string;
  interestedCount?: number;
  isRsvp?: boolean;
  requireApproval?: boolean;
  ticketType?: string;
  ticketTiers?: { price: string }[];
  privacy?: string;
  isBlurred?: boolean;
  creator?: {
    id: number;
    username: string;
    fullName: string;
    profileImage?: string;
  };
}

interface IOSEventCardProps {
  event: Event;
}

export function IOSEventCard({ event }: IOSEventCardProps) {
  const [, setLocation] = useLocation();

  // Abbreviated date and time formatting on one line
  const formattedDateTime = format(new Date(event.date), "EEE, MMM d · h:mm a");
  
  // Determine the price text based on event type
  let priceText = "Free";
  
  if (event.isRsvp || event.requireApproval) {
    priceText = "RSVP";
  } else if (event.ticketTiers && event.ticketTiers.length > 0) {
    const prices = event.ticketTiers.map(tier => parseFloat(tier.price));
    const hasPaidTiers = prices.some(price => price > 0);
    if (hasPaidTiers) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      priceText = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
  } else if (event.ticketType === 'paid' && event.price && parseFloat(event.price) > 0) {
    priceText = `$${event.price}`;
  }

  // Check if this is a private event that should be blurred
  const isPrivateBlurred = event.isBlurred || event.privacy === 'private';

  return (
    <div 
      className="flex gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
      onClick={() => setLocation(`/event/${event.id}`)}
      data-testid={`event-card-${event.id}`}
    >
      {/* Event Image - iOS style larger size */}
      <div className="w-40 h-40 bg-muted rounded-none flex-shrink-0 flex items-center justify-center overflow-hidden relative">
        {event.image ? (
          <>
            <img
              src={event.image}
              alt={event.title}
              className={`w-full h-full object-cover ${isPrivateBlurred ? 'blur-xl' : ''}`}
              loading="lazy"
            />
            {isPrivateBlurred ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <Lock className="w-8 h-8 text-white mb-2" />
                <span className="text-white text-xs font-medium">Private Event</span>
              </div>
            ) : (
              <div className="absolute bottom-2 right-2 pointer-events-none z-10">
                <div className="bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-1 rounded-full">
                  DEMO
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`w-full h-full bg-muted flex items-center justify-center ${isPrivateBlurred ? 'blur-lg' : ''}`}>
            <span className="text-muted-foreground text-lg font-light tracking-wider">MÁLY</span>
            {isPrivateBlurred && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <Lock className="w-8 h-8 text-white mb-2" />
                <span className="text-white text-xs font-medium">Private Event</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Event Details - Simplified with vertical alignment */}
      <div className="flex-1 flex flex-col justify-between pr-2 min-w-0">
        {/* Title - aligned to top */}
        <h3 className={`text-sm sm:text-base md:text-lg font-semibold text-foreground leading-tight whitespace-nowrap overflow-hidden ${isPrivateBlurred ? 'blur-sm' : ''}`}>
          {isPrivateBlurred ? 'Private Event' : event.title}
        </h3>
        
        {/* Middle elements - evenly spaced */}
        <div className="flex-1 flex flex-col justify-evenly">
          <p className={`text-sm text-foreground truncate whitespace-nowrap ${isPrivateBlurred ? 'blur-sm' : ''}`}>
            {formattedDateTime}
          </p>
          
          {event.location && (
            <p className={`text-sm text-foreground truncate ${isPrivateBlurred ? 'blur-sm' : ''}`}>
              {isPrivateBlurred ? 'Location Hidden' : event.location}
            </p>
          )}
        </div>
        
        {/* Price - aligned to bottom */}
        <p className="text-sm text-foreground truncate">
          {isPrivateBlurred ? 'Request Access' : priceText}
        </p>
      </div>
    </div>
  );
}