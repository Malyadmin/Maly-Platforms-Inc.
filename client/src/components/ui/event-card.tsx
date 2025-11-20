import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useTranslation } from "@/lib/translations";

interface EventCardProps {
  title: string;
  date: Date;
  location: string;
  imageUrl: string;
  price: string;
  attendees: Array<{
    name: string;
    avatar?: string;
  }>;
  interestedCount: number;
  interestedUsers?: Array<{
    id: number;
    name: string;
    image: string;
  }>;
}

export function EventCard({
  title,
  date,
  location,
  imageUrl,
  price,
  attendees,
  interestedCount,
  interestedUsers = [],
}: EventCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden bg-black/40 border-white/10 backdrop-blur-sm">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/70 text-white font-bold px-4 py-2 text-center rotate-[-15deg] text-lg sm:text-xl whitespace-nowrap">
            FOR DEMO ONLY
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/60">
                {format(date, "EEE, MMM d, h:mm a")}
              </p>
              <h3 className="text-lg font-semibold text-foreground mt-1">{title}</h3>
            </div>
            <div className="text-right text-foreground z-10">
              {price === "0" ? (
                <p className="font-semibold text-foreground text-lg">{t('free')}</p>
              ) : (
                <>
                  <p className="font-semibold text-foreground text-lg">${price}</p>
                  <p className="text-sm text-foreground/60">{t('perPerson')}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {(interestedUsers.length > 0 ? interestedUsers : attendees).slice(0, 4).map((attendee, i) => (
              <Avatar key={i} className="border-2 border-background w-8 h-8">
                <AvatarImage 
                  src={'image' in attendee ? attendee.image : attendee.avatar} 
                  alt={attendee.name} 
                  className="object-cover object-center"
                />
                <AvatarFallback>{attendee.name[0]}</AvatarFallback>
              </Avatar>
            ))}
            {interestedCount > 4 && (
              <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-sm text-primary">
                +{interestedCount - 4}
              </div>
            )}
          </div>
          <p className="text-sm text-foreground/60">
            {interestedCount} {t('interested')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}