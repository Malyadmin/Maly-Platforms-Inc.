import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useEvents } from "@/hooks/use-events";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Plus, Star, Calendar, X, UserCircle, Filter, Inbox, ChevronDown } from "lucide-react";
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
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('Anytime');
  const [showFiltersBar, setShowFiltersBar] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
  const hasMoreEvents = filteredEvents.length > displayCount;
  
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

  // Toggle dropdown
  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Handle filter click
  const handleFilterClick = () => {
    setShowFiltersBar(!showFiltersBar);
    setActiveDropdown(null);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCity("all");
    setSelectedEventTypes([]);
    setSelectedTimeFilter('Anytime');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FirstEventModal 
        cityName={selectedCity} 
        open={showFirstEventModal} 
        onClose={handleModalClose} 
      />
      {/* iOS-style Header */}
      <div className="bg-black text-white sticky top-0 z-50">
        {/* Top bar with MÁLY logo on left and inbox icon on right */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-white p-2 hover:bg-white/10"
            onClick={() => setLocation("/inbox")}
            data-testid="button-inbox-header"
          >
            <Inbox className="h-7 w-7" />
          </Button>
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            {/* Discover title with gradient - uppercase with letter spacing */}
            <h2 className="gradient-text text-lg font-medium uppercase tracking-widest">Discover</h2>
            
            {/* Filter icon */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white p-2 hover:bg-white/10"
              onClick={handleFilterClick}
              data-testid="filters-button"
            >
              <Filter className="h-7 w-7" />
            </Button>
          </div>
        </div>

        {/* Filter Bar - Shows when filter icon is clicked */}
        {showFiltersBar && (
          <div className="border-t border-gray-800">
          {/* Filter Categories */}
          <div className="px-5 py-3 flex items-center justify-between gap-6 relative">
            {/* When */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('when')}
                className="text-white text-sm hover:text-purple-400 transition-colors flex items-center gap-1"
                data-testid="filter-category-when"
              >
                When
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'when' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'when' && (
                <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[140px]">
                  {['Anytime', 'Today', 'This Week', 'This Weekend'].map((time) => (
                    <button
                      key={time}
                      onClick={() => { setSelectedTimeFilter(time); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg"
                      data-testid={`when-option-${time.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('city')}
                className="text-white text-sm hover:text-purple-400 transition-colors flex items-center gap-1"
                data-testid="filter-category-city"
              >
                City
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'city' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'city' && (
                <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => { setSelectedCity('all'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 first:rounded-t-lg sticky top-0 bg-gray-900"
                    data-testid="city-option-all"
                  >
                    {t('allLocations')}
                  </button>
                  {DIGITAL_NOMAD_CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
                      data-testid={`city-option-${city.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vibes */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('vibes')}
                className="text-white text-sm hover:text-purple-400 transition-colors flex items-center gap-1"
                data-testid="filter-category-vibes"
              >
                Vibes
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'vibes' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'vibes' && (
                <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                  {VIBE_AND_MOOD_TAGS.map((vibe) => (
                    <button
                      key={vibe}
                      onClick={() => {
                        setSelectedEventTypes(prev => 
                          prev.includes(vibe) 
                            ? prev.filter(t => t !== vibe)
                            : [...prev, vibe]
                        );
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 flex items-center gap-2"
                      data-testid={`vibe-option-${vibe.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {selectedEventTypes.includes(vibe) && <span className="text-purple-400">✓</span>}
                      {vibe}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear All X */}
            {(selectedCity !== 'all' || selectedEventTypes.length > 0 || selectedTimeFilter !== 'Anytime') && (
              <button
                onClick={clearAllFilters}
                className="ml-auto text-white hover:text-purple-400 transition-colors"
                data-testid="clear-all-filters"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Selected Filters Bar */}
          {selectedEventTypes.length > 0 && (
            <div className="px-5 pb-3">
              <div className="flex flex-wrap gap-2">
                {selectedEventTypes.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="bg-gray-800 text-white flex items-center gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs max-w-[45vw] sm:max-w-none"
                  >
                    <span className="truncate">{type}</span>
                    <button
                      onClick={() => setSelectedEventTypes(prev => prev.filter(t => t !== type))}
                      className="hover:text-purple-400 transition-colors flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <main className="bg-black text-white pb-24">
          <div className="px-4 py-3">
            {/* Event Grid with Date Categories */}
            <div className="space-y-3">
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
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
              <div className="space-y-6">
                {selectedTimeFilter === 'Anytime' ? (
                  // Show all time-based sections when "Anytime" is selected
                  <>
                    {/* Today's Events Section */}
                    {groupedEvents.todayOnly.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">TODAY</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.todayOnly.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* This Week Section */}
                    {groupedEvents.thisWeek.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">THIS WEEK</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.thisWeek.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* This Weekend Section */}
                    {groupedEvents.thisWeekend.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">THIS WEEKEND</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.thisWeekend.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Next Week Section */}
                    {groupedEvents.nextWeek.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">NEXT WEEK</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.nextWeek.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Weekend Section */}
                    {groupedEvents.nextWeekend.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">NEXT WEEKEND</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.nextWeekend.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* This Month Section */}
                    {groupedEvents.month.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">THIS MONTH</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.month.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Events Section */}
                    {groupedEvents.upcoming.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">UPCOMING</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.upcoming.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Show only the selected time period
                  <>
                    {selectedTimeFilter === 'Today' && groupedEvents.todayOnly.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">TODAY</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.todayOnly.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedTimeFilter === 'This Week' && groupedEvents.thisWeek.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">THIS WEEK</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.thisWeek.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedTimeFilter === 'This Weekend' && groupedEvents.thisWeekend.length > 0 && (
                      <div className="space-y-4">
                        <div className="py-1">
                          <h2 className="text-sm font-medium text-white tracking-wide">THIS WEEKEND</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.thisWeekend.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
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