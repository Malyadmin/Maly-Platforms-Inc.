import { format, parse } from "date-fns";
import { Clock } from "lucide-react";
import { useTranslation } from "@/lib/translations";

interface ItineraryItem {
  startTime: string;
  endTime: string;
  description: string;
}

interface EventItineraryProps {
  itinerary: ItineraryItem[];
}

export function EventItinerary({ itinerary }: EventItineraryProps) {
  const { t } = useTranslation();
  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  const formatTimeDisplay = (timeString: string) => {
    try {
      // Handle different potential time formats
      let dateObj;
      if (timeString.includes('T')) {
        // If it's in ISO format
        dateObj = new Date(timeString);
      } else if (timeString.includes(':')) {
        // If it's in "HH:MM" format
        const [hours, minutes] = timeString.split(':').map(Number);
        dateObj = new Date();
        dateObj.setHours(hours, minutes, 0, 0);
      } else {
        // Fall back to original string if format is unknown
        return timeString;
      }
      
      return format(dateObj, 'h:mm a');
    } catch (e) {
      console.error("Error formatting time:", timeString, e);
      return timeString;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Clock className="h-5 w-5" />
        {t('eventSchedule')}
      </h3>
      
      <div className="space-y-6">
        {itinerary.map((item, index) => (
          <div key={index} className="border-l-2 border-white/20 pl-4 relative">
            {/* Time dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {formatTimeDisplay(item.startTime)} - {formatTimeDisplay(item.endTime)}
              </div>
              <p className="text-foreground/70">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}