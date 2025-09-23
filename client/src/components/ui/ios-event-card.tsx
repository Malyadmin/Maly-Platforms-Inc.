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
}

interface IOSEventCardProps {
  event: Event;
}

export function IOSEventCard({ event }: IOSEventCardProps) {
  const [, setLocation] = useLocation();

  const formattedDate = format(new Date(event.date), "EEEE, MMMM d, h:mm a");
  const priceText = event.price === "0" ? "$00 (notes)" : `$${event.price} (notes)`;

  return (
    <div 
      className="flex gap-4 cursor-pointer hover:bg-gray-900/20 p-2 rounded-lg transition-colors"
      onClick={() => setLocation(`/event/${event.id}`)}
      data-testid={`event-card-${event.id}`}
    >
      {/* Event Image - iOS style 128x128 */}
      <div className="w-32 h-32 bg-gray-700 rounded-none flex-shrink-0 flex items-center justify-center overflow-hidden">
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
          
          <p className="text-sm text-white">
            {priceText}
          </p>
          
          <p className="text-sm text-white">
            {event.interestedCount || 0} Interested
          </p>
        </div>
        
        {/* User Avatars - iOS style placeholder rectangles */}
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4].map((_, index) => (
            <div 
              key={index} 
              className="w-8 h-8 bg-gray-600 flex items-center justify-center"
              data-testid={`avatar-placeholder-${index}`}
            >
              <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}