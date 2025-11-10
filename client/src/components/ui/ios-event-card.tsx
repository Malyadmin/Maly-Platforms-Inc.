import { format } from "date-fns";
import { useLocation } from "wouter";

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

  return (
    <div 
      className="flex gap-4 cursor-pointer hover:bg-gray-900/20 p-2 rounded-lg transition-colors"
      onClick={() => setLocation(`/event/${event.id}`)}
      data-testid={`event-card-${event.id}`}
    >
      {/* Event Image - iOS style larger size */}
      <div className="w-40 h-40 bg-gray-700 rounded-none flex-shrink-0 flex items-center justify-center overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-muted-foreground text-lg font-light tracking-wider">MÁLY</span>
          </div>
        )}
      </div>
      
      {/* Event Details - Simplified with vertical alignment */}
      <div className="flex-1 flex flex-col justify-between pr-2 min-w-0">
        {/* Title - aligned to top */}
        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-foreground leading-tight whitespace-nowrap overflow-hidden">
          {event.title}
        </h3>
        
        {/* Middle elements - evenly spaced */}
        <div className="flex-1 flex flex-col justify-evenly">
          <p className="text-sm text-foreground/80 truncate whitespace-nowrap">
            {formattedDateTime}
          </p>
          
          {event.location && (
            <p className="text-sm text-foreground/80 truncate">
              {event.location}
            </p>
          )}
        </div>
        
        {/* Price - aligned to bottom */}
        <p className="text-sm text-foreground truncate">
          {priceText}
        </p>
      </div>
    </div>
  );
}