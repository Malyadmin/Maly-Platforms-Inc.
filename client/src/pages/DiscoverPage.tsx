import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useEvents } from "@/hooks/use-events";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Search, Plus, Star, Calendar, X, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { DIGITAL_NOMAD_CITIES, VIBE_AND_MOOD_TAGS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/translations";
import { Skeleton } from "@/components/ui/skeleton";
import { FirstEventModal } from "@/components/FirstEventModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IOSEventCard } from "@/components/ui/ios-event-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

// Use unified event mood taxonomy for filtering events
const EVENT_TYPES = VIBE_AND_MOOD_TAGS;

const categories = [
  "Concerts",
  "Coworking",
  "Cultural",
  "Day Parties",
  "Day Trips",
  "Excursions",
  "Getaways",
  "Networking",
  "Nightlife",
  "Retail",
  "Retreats",
  "Social",
  "Sports",
  "Tech",
  "Travel",
  "VIP Events",
  "Volunteer",
];

export default function DiscoverPage() {
  const { t } = useTranslation();
  
  // Price display helper function for translation
  const renderPrice = (price: string) => {
    if (price === "0") {
      return <p className="font-semibold text-white text-xs sm:text-sm md:text-lg">{t('free')}</p>;
    } else {
      return (
        <>
          <p className="font-semibold text-white text-xs sm:text-sm md:text-lg">${price}</p>
          <p className="text-[8px] sm:text-xs md:text-sm text-white/60">{t('perPerson')}</p>
        </>
      );
    }
  };
  const [selectedCity, setSelectedCity] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // Removed dateFilter state, as we'll always show all events organized by date
  const { events: fetchedEvents, isLoading } = useEvents(undefined, selectedCity);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [displayCount, setDisplayCount] = useState(24); // Increased initial count to display more items
  const itemsPerBatch = 12; // Load more items on each scroll
  const observerTarget = useRef(null);
  const [showFirstEventModal, setShowFirstEventModal] = useState(false);
  const [seenEmptyCities, setSeenEmptyCities] = useState<string[]>([]);
  
  const allEvents = fetchedEvents || [];

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    const matchesEventTypes = selectedEventTypes.length === 0 ||
                             event.tags?.some(tag => selectedEventTypes.includes(tag));
    
    return matchesSearch && matchesCategory && matchesEventTypes;
  });

  // Date utilities for categorizing events
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Reset hours to start of day for proper comparison
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  
  // Calculate end of today
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);
  
  // Calculate THIS WEEK (Monday-Friday of current week)
  // If today is a weekend day, thisWeek will be empty
  const startOfThisWeek = new Date(startOfToday);
  const endOfThisWeek = new Date(startOfToday);
  
  // Set to Monday of current week if we're before or on Friday
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    // Only include days after today up to Friday
    // End of this week is Friday of current week
    const daysUntilFriday = 5 - dayOfWeek;
    endOfThisWeek.setDate(startOfToday.getDate() + daysUntilFriday);
    endOfThisWeek.setHours(23, 59, 59, 999);
  } else {
    // If today is weekend, thisWeek is empty (set end before start)
    endOfThisWeek.setDate(startOfToday.getDate() - 1);
  }
  
  // Calculate THIS WEEKEND (Saturday-Sunday of current week)
  const startOfThisWeekend = new Date(startOfToday);
  const endOfThisWeekend = new Date(startOfToday);
  
  if (dayOfWeek < 6) { // Before Saturday
    // Start of this weekend is upcoming Saturday
    startOfThisWeekend.setDate(startOfToday.getDate() + (6 - dayOfWeek));
    startOfThisWeekend.setHours(0, 0, 0, 0);
    
    // End of this weekend is upcoming Sunday
    endOfThisWeekend.setDate(startOfToday.getDate() + (7 - dayOfWeek));
    endOfThisWeekend.setHours(23, 59, 59, 999);
  } else if (dayOfWeek === 6) { // Today is Saturday
    // Start of this weekend is today
    // End of this weekend is tomorrow (Sunday)
    endOfThisWeekend.setDate(startOfToday.getDate() + 1);
    endOfThisWeekend.setHours(23, 59, 59, 999);
  } else { // Today is Sunday
    // Today is the last day of this weekend
    endOfThisWeekend.setHours(23, 59, 59, 999);
  }
  
  // Calculate NEXT WEEK (Monday-Friday of next week)
  const startOfNextWeek = new Date(startOfToday);
  const endOfNextWeek = new Date(startOfToday);
  
  // Find days until next Monday
  let daysUntilNextMonday = (8 - dayOfWeek) % 7;
  if (daysUntilNextMonday === 0) daysUntilNextMonday = 7; // If today is Monday, go to next Monday
  
  // Start of next week is next Monday
  startOfNextWeek.setDate(startOfToday.getDate() + daysUntilNextMonday);
  startOfNextWeek.setHours(0, 0, 0, 0);
  
  // End of next week is next Friday
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 4); // Monday + 4 days = Friday
  endOfNextWeek.setHours(23, 59, 59, 999);
  
  // Calculate NEXT WEEKEND (Saturday-Sunday of next week)
  const startOfNextWeekend = new Date(endOfNextWeek);
  startOfNextWeekend.setDate(endOfNextWeek.getDate() + 1); // Friday + 1 = Saturday
  startOfNextWeekend.setHours(0, 0, 0, 0);
  
  const endOfNextWeekend = new Date(startOfNextWeekend);
  endOfNextWeekend.setDate(startOfNextWeekend.getDate() + 1); // Saturday + 1 = Sunday
  endOfNextWeekend.setHours(23, 59, 59, 999);
  
  // THIS MONTH is everything after next weekend up to 30 days from today
  const startOfRestOfMonth = new Date(endOfNextWeekend);
  startOfRestOfMonth.setDate(endOfNextWeekend.getDate() + 1);
  startOfRestOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(startOfToday);
  endOfMonth.setDate(startOfToday.getDate() + 30);

  // Group events by date categories
  const groupedEvents = {
    todayOnly: filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      // "TODAY" - Events happening only today
      return eventDate >= startOfToday && eventDate <= endOfToday;
    }),
    thisWeek: filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      // "THIS WEEK" - Weekdays (Mon-Fri) of current week, excluding today
      return eventDate > endOfToday && eventDate <= endOfThisWeek;
    }),
    thisWeekend: filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      // "THIS WEEKEND" - Saturday and Sunday of current week
      return eventDate >= startOfThisWeekend && eventDate <= endOfThisWeekend;
    }),
    nextWeek: filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      // "NEXT WEEK" - Weekdays (Mon-Fri) of next week
      return eventDate >= startOfNextWeek && eventDate <= endOfNextWeek;
    }),
    nextWeekend: filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      // "NEXT WEEKEND" - Saturday and Sunday of next week
      return eventDate >= startOfNextWeekend && eventDate <= endOfNextWeekend;
    }),
    month: filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      // "THIS MONTH" - Events after next weekend but within 30 days
      return eventDate > endOfNextWeekend && eventDate < endOfMonth;
    }),
    upcoming: filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      // "UPCOMING" - Events more than 30 days from now
      return eventDate >= endOfMonth;
    })
  };

  // Create a flattened list of all filtered events for display count
  const allFilteredEvents = [...filteredEvents];
  const hasMoreEvents = allFilteredEvents.length > displayCount;
  
  // Load more events when scrolling to the bottom
  const loadMoreEvents = useCallback(() => {
    if (hasMoreEvents) {
      setDisplayCount(prev => prev + itemsPerBatch);
    }
  }, [hasMoreEvents]);
  
  // Set up the intersection observer for infinite scrolling
  useEffect(() => {
    if (!observerTarget.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreEvents && !isLoading) {
        loadMoreEvents();
      }
    }, { 
      rootMargin: '100px' // Load more content before reaching the bottom
    });
    
    observer.observe(observerTarget.current);
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasMoreEvents, isLoading, loadMoreEvents]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(24); // Reset to initial count when filters change
  }, [searchTerm, selectedCity, selectedCategory, selectedEventTypes]);

  // Check for empty city and show modal if needed
  useEffect(() => {
    // Only check if we have a valid city (not 'all') and data is loaded
    const isEmptyCity = selectedCity !== 'all' && !isLoading && allEvents.length === 0;
    
    // Show modal if this is an empty city and we haven't shown it before for this city
    if (isEmptyCity && !seenEmptyCities.includes(selectedCity)) {
      setShowFirstEventModal(true);
    }
  }, [selectedCity, allEvents, isLoading, seenEmptyCities]);
  
  // Handle modal close
  const handleModalClose = () => {
    setShowFirstEventModal(false);
    // Add this city to the list of seen empty cities so we don't show the modal again
    setSeenEmptyCities(prev => [...prev, selectedCity]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FirstEventModal 
        cityName={selectedCity} 
        open={showFirstEventModal} 
        onClose={handleModalClose} 
      />
      
      {/* iOS-style Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="bg-black text-white border-gray-800 max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setShowFilterModal(false)}
                className="text-white p-0 h-auto font-normal"
              >
                Cancel
              </Button>
              <DialogTitle className="text-white text-lg font-semibold">Filter Events</DialogTitle>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedEventTypes([])}
                className="text-white p-0 h-auto font-normal"
              >
                Clear All
              </Button>
            </div>
            <p className="text-gray-400 text-sm mt-2">Customize your event discovery</p>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* When Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                <h3 className="text-white font-medium">When</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Anytime', 'Today', 'This Week', 'This Weekend'].map((time) => (
                  <Button
                    key={time}
                    variant={time === 'Anytime' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-full ${
                      time === 'Anytime' 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'border-gray-600 text-white hover:bg-gray-800'
                    }`}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Distance Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                <h3 className="text-white font-medium">Distance</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Any Distance', 'Within 1 mile', 'Within 5 miles'].map((distance) => (
                  <Button
                    key={distance}
                    variant={distance === 'Any Distance' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-full ${
                      distance === 'Any Distance' 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'border-gray-600 text-white hover:bg-gray-800'
                    }`}
                  >
                    {distance}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Vibes Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                <h3 className="text-white font-medium">Vibes</h3>
              </div>
              
              {/* Wellness & Movement */}
              <div className="mb-4">
                <h4 className="text-white/70 text-sm mb-2">Wellness & Movement</h4>
                <div className="flex flex-wrap gap-2">
                  {['Wellness', 'Movement', 'Fitness', 'Yoga', 'Meditation', 'Mindfulness'].map((vibe) => (
                    <Button
                      key={vibe}
                      variant={selectedEventTypes.includes(vibe) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedEventTypes(prev => 
                          prev.includes(vibe) 
                            ? prev.filter(t => t !== vibe)
                            : [...prev, vibe]
                        );
                      }}
                      className={`rounded-full text-xs px-3 py-1 h-8 ${
                        selectedEventTypes.includes(vibe) 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'border-gray-600 text-white hover:bg-gray-800'
                      }`}
                    >
                      {vibe}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Social & Entertainment */}
              <div className="mb-4">
                <h4 className="text-white/70 text-sm mb-2">Social & Entertainment</h4>
                <div className="flex flex-wrap gap-2">
                  {['Nightlife', 'Social', 'Networking', 'Dating', 'Party', 'Music'].map((vibe) => (
                    <Button
                      key={vibe}
                      variant={selectedEventTypes.includes(vibe) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedEventTypes(prev => 
                          prev.includes(vibe) 
                            ? prev.filter(t => t !== vibe)
                            : [...prev, vibe]
                        );
                      }}
                      className={`rounded-full text-xs px-3 py-1 h-8 ${
                        selectedEventTypes.includes(vibe) 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'border-gray-600 text-white hover:bg-gray-800'
                      }`}
                    >
                      {vibe}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Learning & Culture */}
              <div className="mb-4">
                <h4 className="text-white/70 text-sm mb-2">Learning & Culture</h4>
                <div className="flex flex-wrap gap-2">
                  {['Learning', 'Cultural', 'Educational', 'Art', 'Creative', 'Tech'].map((vibe) => (
                    <Button
                      key={vibe}
                      variant={selectedEventTypes.includes(vibe) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedEventTypes(prev => 
                          prev.includes(vibe) 
                            ? prev.filter(t => t !== vibe)
                            : [...prev, vibe]
                        );
                      }}
                      className={`rounded-full text-xs px-3 py-1 h-8 ${
                        selectedEventTypes.includes(vibe) 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'border-gray-600 text-white hover:bg-gray-800'
                      }`}
                    >
                      {vibe}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Adventure & Travel */}
              <div className="mb-4">
                <h4 className="text-white/70 text-sm mb-2">Adventure & Travel</h4>
                <div className="flex flex-wrap gap-2">
                  {['Adventure', 'Travel', 'Outdoor', 'Day Trip', 'Excursions', 'Active'].map((vibe) => (
                    <Button
                      key={vibe}
                      variant={selectedEventTypes.includes(vibe) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedEventTypes(prev => 
                          prev.includes(vibe) 
                            ? prev.filter(t => t !== vibe)
                            : [...prev, vibe]
                        );
                      }}
                      className={`rounded-full text-xs px-3 py-1 h-8 ${
                        selectedEventTypes.includes(vibe) 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'border-gray-600 text-white hover:bg-gray-800'
                      }`}
                    >
                      {vibe}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* iOS-style Header */}
      <div className="bg-black text-white sticky top-0 z-50">
        {/* MÁLY logo centered at top */}
        <div className="flex justify-center pt-3 pb-4">
          <h1 className="text-white text-xl font-bold tracking-[0.3em] leading-none" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>MÁLY</h1>
        </div>
        
        {/* Controls and search section */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            {/* Left side - City and Add filter */}
            <div className="flex flex-col items-start space-y-2">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="bg-transparent border-none text-white text-lg font-normal p-0 h-auto flex items-center gap-2">
                  <SelectValue placeholder="City name" />
                  <MapPin className="h-4 w-4 text-white" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allLocations')}</SelectItem>
                  {DIGITAL_NOMAD_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                className="text-white text-sm font-normal p-0 h-auto flex items-center gap-2 hover:bg-transparent"
                onClick={() => setShowFilterModal(true)}
              >
                Add filter
                <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center">
                  <Plus className="h-3 w-3" />
                </div>
              </Button>
            </div>

            {/* Right side - Search */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white p-2 hover:bg-white/10"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Event count */}
          <div className="text-white/70 text-sm">
            {allFilteredEvents.length} {allFilteredEvents.length === 1 ? 'event' : 'events'} found
          </div>
        </div>
        
        {/* Search Bar (conditionally shown) */}
        {showSearch && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('searchEvents')}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <main className="bg-black text-white pb-24">
          {/* Selected Filters Display */}
          {selectedEventTypes.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="flex flex-wrap gap-2">
                {selectedEventTypes.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="px-3 py-1 flex items-center gap-2 text-xs bg-gray-800 text-white"
                  >
                    {type}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedEventTypes(prev => prev.filter(t => t !== type));
                      }}
                      className="hover:text-red-400 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEventTypes([])}
                  className="text-gray-400 hover:text-white text-xs h-8 px-3"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}

          <div className="px-4 py-6">
            {/* Event Grid with Date Categories */}
            <div className="space-y-6 sm:space-y-8">
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
                {filteredEvents.length} {t('eventsFound')}
              </h2>

            {isLoading ? (
              // Loading skeleton list
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex gap-4 p-2">
                    <Skeleton className="w-32 h-32 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4].map((_, i) => (
                          <Skeleton key={i} className="w-8 h-8" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-lg text-muted-foreground mb-4">No events match your search criteria</p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedEventTypes([]);
                }}>
                  {t('filters')}
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Today's Events Section */}
                {groupedEvents.todayOnly.length > 0 && (
                  <div className="space-y-6">
                    <div className="py-2">
                      <h2 className="text-sm font-medium text-white tracking-wide">THIS WEEK</h2>
                    </div>
                    <div className="space-y-6">
                      {groupedEvents.todayOnly.map((event: any) => (
                        <IOSEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* This Week Section */}
                {groupedEvents.thisWeek.length > 0 && (
                  <div className="space-y-6">
                    <div className="py-2">
                      <h2 className="text-sm font-medium text-white tracking-wide">THIS WEEK</h2>
                    </div>
                    <div className="space-y-6">
                      {groupedEvents.thisWeek.map((event: any) => (
                        <IOSEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* This Weekend Section */}
                {groupedEvents.thisWeekend.length > 0 && (
                  <div className="space-y-6">
                    <div className="py-2">
                      <h2 className="text-sm font-medium text-white tracking-wide">THIS WEEKEND</h2>
                    </div>
                    <div className="space-y-6">
                      {groupedEvents.thisWeekend.map((event: any) => (
                        <IOSEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Next Week Section */}
                {groupedEvents.nextWeek.length > 0 && (
                  <div className="space-y-6">
                    <div className="py-2">
                      <h2 className="text-sm font-medium text-white tracking-wide">NEXT WEEK</h2>
                    </div>
                    <div className="space-y-6">
                      {groupedEvents.nextWeek.map((event: any) => (
                        <IOSEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                
                {/* Next Weekend Section */}
                {groupedEvents.nextWeekend.length > 0 && (
                  <div className="space-y-6">
                    <div className="py-2">
                      <h2 className="text-sm font-medium text-white tracking-wide">NEXT WEEKEND</h2>
                    </div>
                    <div className="space-y-6">
                      {groupedEvents.nextWeekend.map((event: any) => (
                        <IOSEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {/* This Month Section */}
                {groupedEvents.month.length > 0 && (
                  <div className="space-y-6">
                    <div className="py-2">
                      <h2 className="text-sm font-medium text-white tracking-wide">THIS MONTH</h2>
                    </div>
                    <div className="space-y-6">
                      {groupedEvents.month.map((event: any) => (
                        <IOSEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Events Section */}
                {groupedEvents.upcoming.length > 0 && (
                  <div className="space-y-6">
                    <div className="py-2">
                      <h2 className="text-sm font-medium text-white tracking-wide">UPCOMING</h2>
                    </div>
                    <div className="space-y-6">
                      {groupedEvents.upcoming.map((event: any) => (
                        <IOSEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Events Message */}
                {groupedEvents.todayOnly.length === 0 && 
                 groupedEvents.thisWeek.length === 0 &&
                 groupedEvents.nextWeekend.length === 0 &&
                 groupedEvents.thisWeekend.length === 0 &&
                 groupedEvents.nextWeek.length === 0 && 
                 groupedEvents.month.length === 0 && 
                 groupedEvents.upcoming.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-lg text-muted-foreground mb-4">No events match your search criteria</p>
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setSelectedEventTypes([]);
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                )}

                {/* Intersection Observer Target for Infinite Scrolling */}
                {hasMoreEvents && (
                  <div 
                    ref={observerTarget} 
                    className="h-10 w-full flex items-center justify-center mt-8 mb-4"
                  >
                    {isLoading ? (
                      <div className="animate-pulse flex space-x-2">
                        <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                        <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                        <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Scroll for more events</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <BottomNav />
      </div>
    </div>
    </div>
  );
}