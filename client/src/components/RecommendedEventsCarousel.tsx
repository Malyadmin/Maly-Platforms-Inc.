import { useRecommendedEvents, type RecommendedEvent } from "@/hooks/use-recommended-events";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/translations";

export function RecommendedEventsCarousel() {
  const { recommendedEvents, isLoading } = useRecommendedEvents();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t('recommendedForYou')}</h2>
        <Carousel className="w-full">
          <CarouselContent>
            {[1, 2, 3].map((_, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Skeleton className="h-[300px] w-full rounded-xl" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  if (!recommendedEvents?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Recommended For You</h2>
      <Carousel className="w-full">
        <CarouselContent>
          {recommendedEvents.map((event: RecommendedEvent) => (
            <CarouselItem key={event.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card 
                  className="overflow-hidden border-0 bg-[#1a1a1a] shadow-card transition-all duration-300 hover:shadow-card-hover glass cursor-pointer"
                  onClick={() => setLocation(`/event/${event.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[3/2] relative">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="bg-black/70 text-white font-bold px-3 py-1.5 text-center rotate-[-15deg] text-base sm:text-lg whitespace-nowrap">
                          FOR DEMO ONLY
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {event.tags?.slice(0, 2).map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs bg-accent text-foreground"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {((event.attendingCount || 0) + (event.interestedCount || 0)) > 10 && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {t('trending')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-foreground/60">
                            {format(new Date(event.date), "EEE, MMM d, h:mm a")}
                          </p>
                          <h3 className="font-semibold text-foreground mt-1 line-clamp-2">
                            {event.title}
                          </h3>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 min-w-0">
                              <MapPin className="h-3 w-3 flex-shrink-0 text-foreground/60" />
                              <span className="text-xs text-foreground/60 truncate">
                                {event.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}