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

  const formattedDateTime = format(new Date(event.date), "EEE, MMM d · h:mm a");
  
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

  const isPrivateBlurred = event.isBlurred || event.privacy === 'private';

  return (
    <div 
      className="flex gap-4 cursor-pointer hover:bg-muted/30 py-2 rounded transition-colors"
      onClick={() => setLocation(`/event/${event.id}`)}
      data-testid={`event-card-${event.id}`}
    >
      <div className="w-[130px] h-[130px] bg-muted rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden relative">
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
                <span className="text-white text-[11px] font-normal uppercase tracking-wide">Private Event</span>
              </div>
            ) : (
              <div className="absolute bottom-2 right-2 pointer-events-none z-10">
                <div className="bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-normal uppercase tracking-wide px-2 py-1 rounded-sm">
                  DEMO
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`w-full h-full bg-muted flex items-center justify-center ${isPrivateBlurred ? 'blur-lg' : ''}`}>
            <span className="text-muted-foreground text-[14px] font-light tracking-widest uppercase">MÁLY</span>
            {isPrivateBlurred && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <Lock className="w-8 h-8 text-white mb-2" />
                <span className="text-white text-[11px] font-normal uppercase tracking-wide">Private Event</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between pr-2 min-w-0 py-1">
        <h3 className={`text-[16px] font-medium text-foreground leading-tight line-clamp-2 ${isPrivateBlurred ? 'blur-sm' : ''}`}>
          {isPrivateBlurred ? 'Private Event' : event.title}
        </h3>
        
        <div className="flex flex-col gap-1">
          <p className={`text-[13px] text-foreground/75 ${isPrivateBlurred ? 'blur-sm' : ''}`}>
            {formattedDateTime}
          </p>
          
          {event.location && (
            <p className={`text-[13px] text-foreground/75 truncate ${isPrivateBlurred ? 'blur-sm' : ''}`}>
              {isPrivateBlurred ? 'Location Hidden' : event.location}
            </p>
          )}
        </div>
        
        <p className="text-[14px] font-medium text-foreground">
          {isPrivateBlurred ? 'Request Access' : priceText}
        </p>
      </div>
    </div>
  );
}
