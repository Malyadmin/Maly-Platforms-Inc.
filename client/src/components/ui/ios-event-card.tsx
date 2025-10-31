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

  const formattedDate = format(new Date(event.date), "EEEE, MMMM d, h:mm a");
  
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
            <span className="text-gray-400 text-lg font-light tracking-wider">MÁLY</span>
          </div>
        )}
      </div>
      
      {/* Event Details */}
      <div className="flex-1 flex flex-col justify-start space-y-2">
        <h3 className="text-lg font-medium text-white leading-tight line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-1">
          <p className="text-sm text-white">
            {formattedDate}
          </p>
          
          {event.location && (
            <p className="text-sm text-white/80">
              {event.location}
            </p>
          )}
          
          <p className="text-sm text-white">
            {priceText}
          </p>
          
          <p className="text-sm text-white">
            {event.interestedCount || 0} Interested
          </p>
        </div>
        
        {/* Event Creator/Host Information */}
        {event.creator && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
              {event.creator.profileImage ? (
                <img
                  src={event.creator.profileImage}
                  alt={event.creator.fullName || event.creator.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-300 text-xs font-medium">
                    {(event.creator.fullName || event.creator.username)?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span 
              className="text-sm text-white hover:text-gray-300 cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/profile/${event.creator?.username}`);
              }}
              data-testid={`creator-link-${event.id}`}
            >
              {event.creator.fullName || event.creator.username}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}