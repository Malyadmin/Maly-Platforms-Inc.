import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useEvents } from "@/hooks/use-events";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Plus, Star, Calendar, X, UserCircle, SlidersHorizontal, ChevronDown, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { DIGITAL_NOMAD_CITIES, CITIES_BY_REGION, VIBE_AND_MOOD_TAGS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/translations";
import { EventGridSkeleton } from "@/components/ui/content-skeleton";
import { FirstEventModal } from "@/components/FirstEventModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IOSEventCard } from "@/components/ui/ios-event-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
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
      return <p className="font-semibold text-foreground text-xs sm:text-sm md:text-lg">{t('free')}</p>;
    } else {
      return (
        <>
          <p className="font-semibold text-foreground text-xs sm:text-sm md:text-lg">${price}</p>
          <p className="text-[8px] sm:text-xs md:text-sm text-foreground/60">{t('perPerson')}</p>
        </>
      );
    }
  };
  const [selectedCity, setSelectedCity] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('Anytime');
  const [showFiltersBar, setShowFiltersBar] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [showAddCityDialog, setShowAddCityDialog] = useState(false);
  const [newCityInput, setNewCityInput] = useState('');
  // Removed dateFilter state, as we'll always show all events organized by date
  const { events: fetchedEvents, isLoading } = useEvents(undefined, selectedCity === 'all' ? undefined : selectedCity);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [displayCount, setDisplayCount] = useState(24); // Increased initial count to display more items
  const itemsPerBatch = 12; // Load more items on each scroll
  const observerTarget = useRef(null);
  const [showFirstEventModal, setShowFirstEventModal] = useState(false);
  const [seenEmptyCities, setSeenEmptyCities] = useState<string[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Check for new user welcome message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isNewUser = urlParams.get('welcome') === 'true' || localStorage.getItem('maly_new_user') === 'true';
    
    if (isNewUser) {
      setShowWelcomeModal(true);
      // Clear the flag so it only shows once
      localStorage.removeItem('maly_new_user');
      // Clean up URL without refreshing page
      if (urlParams.get('welcome')) {
        window.history.replaceState({}, '', '/discover');
      }
    }
  }, []);
  
  const allEvents = fetchedEvents || [];

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    const matchesEventTypes = selectedEventTypes.length === 0 ||
                             event.tags?.some(tag => selectedEventTypes.includes(tag));
    
    return matchesSearch && matchesCategory && matchesEventTypes;
  });

  // Date utilities for categorizing events - using cascade approach to prevent overlaps
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Reset hours to start of day for proper comparison
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  
  // Calculate end of today
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);
  
  // Calculate THIS WEEKEND (current Sat-Sun if we're before or on Sunday)
  let startOfThisWeekend = new Date(startOfToday);
  let endOfThisWeekend = new Date(startOfToday);
  
  if (dayOfWeek === 0) { // Today is Sunday - this weekend is just today
    endOfThisWeekend.setHours(23, 59, 59, 999);
  } else if (dayOfWeek === 6) { // Today is Saturday - this weekend is Sat-Sun
    endOfThisWeekend.setDate(startOfToday.getDate() + 1);
    endOfThisWeekend.setHours(23, 59, 59, 999);
  } else { // Mon-Fri - this weekend is upcoming Sat-Sun
    const daysUntilSaturday = 6 - dayOfWeek;
    startOfThisWeekend.setDate(startOfToday.getDate() + daysUntilSaturday);
    startOfThisWeekend.setHours(0, 0, 0, 0);
    endOfThisWeekend.setDate(startOfThisWeekend.getDate() + 1); // Sunday
    endOfThisWeekend.setHours(23, 59, 59, 999);
  }
  
  // Calculate THIS WEEK (Mon-Fri, only days after today and before this weekend)
  let startOfThisWeek = new Date(endOfToday);
  startOfThisWeek.setMilliseconds(startOfThisWeek.getMilliseconds() + 1); // Start right after today ends
  
  let endOfThisWeek = new Date(startOfThisWeekend);
  endOfThisWeek.setMilliseconds(endOfThisWeek.getMilliseconds() - 1); // End right before this weekend starts
  
  // Calculate NEXT WEEKEND (Sat-Sun of next week)
  const startOfNextWeekend = new Date(endOfThisWeekend);
  startOfNextWeekend.setDate(endOfThisWeekend.getDate() + 6); // Next Saturday (7 days after this Sunday, minus 1)
  startOfNextWeekend.setHours(0, 0, 0, 0);
  
  const endOfNextWeekend = new Date(startOfNextWeekend);
  endOfNextWeekend.setDate(startOfNextWeekend.getDate() + 1); // Next Sunday
  endOfNextWeekend.setHours(23, 59, 59, 999);
  
  // Calculate NEXT WEEK (Mon-Fri between this weekend and next weekend)
  let startOfNextWeek = new Date(endOfThisWeekend);
  startOfNextWeek.setMilliseconds(startOfNextWeek.getMilliseconds() + 1); // Start right after this weekend
  
  let endOfNextWeek = new Date(startOfNextWeekend);
  endOfNextWeek.setMilliseconds(endOfNextWeek.getMilliseconds() - 1); // End right before next weekend
  
  // THIS MONTH is everything after next weekend up to 30 days from today
  const startOfMonth = new Date(endOfNextWeekend);
  startOfMonth.setMilliseconds(startOfMonth.getMilliseconds() + 1);
  
  const endOfMonth = new Date(startOfToday);
  endOfMonth.setDate(startOfToday.getDate() + 30);
  endOfMonth.setHours(23, 59, 59, 999);

  // Group events by date categories - using cascade to ensure no overlaps
  const categorizedEvents = filteredEvents.map(event => ({
    event,
    date: new Date(event.date)
  }));

  const groupedEvents = {
    todayOnly: categorizedEvents
      .filter(({ date }) => date >= startOfToday && date <= endOfToday)
      .map(({ event }) => event),
    
    thisWeek: categorizedEvents
      .filter(({ date }) => date > endOfToday && date < startOfThisWeekend)
      .map(({ event }) => event),
    
    thisWeekend: categorizedEvents
      .filter(({ date }) => date >= startOfThisWeekend && date <= endOfThisWeekend)
      .map(({ event }) => event),
    
    nextWeek: categorizedEvents
      .filter(({ date }) => date > endOfThisWeekend && date < startOfNextWeekend)
      .map(({ event }) => event),
    
    nextWeekend: categorizedEvents
      .filter(({ date }) => date >= startOfNextWeekend && date <= endOfNextWeekend)
      .map(({ event }) => event),
    
    month: categorizedEvents
      .filter(({ date }) => date > endOfNextWeekend && date <= endOfMonth)
      .map(({ event }) => event),
    
    upcoming: categorizedEvents
      .filter(({ date }) => date > endOfMonth)
      .map(({ event }) => event)
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

  // Handle adding custom city
  const handleAddCity = () => {
    const trimmedCity = newCityInput.trim();
    if (trimmedCity && !customCities.includes(trimmedCity) && !DIGITAL_NOMAD_CITIES.includes(trimmedCity)) {
      setCustomCities(prev => [trimmedCity, ...prev]);
      setSelectedCity(trimmedCity);
      setNewCityInput('');
      setShowAddCityDialog(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* Add City Dialog */}
      <Dialog open={showAddCityDialog} onOpenChange={setShowAddCityDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('addCustomCity')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              value={newCityInput}
              onChange={(e) => setNewCityInput(e.target.value)}
              placeholder={t('enterCityName')}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCity(); }}
              data-testid="input-custom-city"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddCityDialog(false); setNewCityInput(''); }} data-testid="button-cancel-add-city">
                {t('cancel')}
              </Button>
              <Button onClick={handleAddCity} disabled={!newCityInput.trim()} data-testid="button-confirm-add-city">
                {t('add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FirstEventModal 
        cityName={selectedCity} 
        open={showFirstEventModal} 
        onClose={handleModalClose} 
      />

      {/* Welcome Modal for new users */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white text-black flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center text-foreground">
              {t('welcomeComplete')}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mt-2">
              {t('welcomeCompleteMessage')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              {t('welcomeCompleteHint')}
            </p>
          </div>
          <Button 
            onClick={() => setShowWelcomeModal(false)}
            className="w-full mt-4 bg-white text-black text-white hover:bg-gray-100"
            data-testid="button-welcome-close"
          >
            {t('letsGetStarted')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* iOS-style Header - Fixed at top */}
      <div className="bg-background text-foreground shrink-0 z-50">
        {/* Top bar with MÁLY logo and hamburger menu (includes theme toggle) */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
          <HamburgerMenu />
        </div>
        
        {/* Title section with divider */}
        <div className="px-5 pb-3 border-b border-border">
          <h2 className="text-foreground text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
            E V E N T S
          </h2>
          <div className="flex items-center justify-between mt-1">
            <div>
              <p className="text-muted-foreground text-xs">Discover remarkable experiences that connect us worldwide.</p>
              {selectedCity !== 'all' && (
                <p className="text-foreground text-sm mt-1">{selectedCity}</p>
              )}
            </div>
            {/* Filter icon */}
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground p-2 hover:bg-foreground/10"
              onClick={handleFilterClick}
              data-testid="filters-button"
            >
              <svg 
                width="28" 
                height="28" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="h-7 w-7"
              >
                <line x1="4" y1="9" x2="20" y2="9" />
                <circle cx="9" cy="9" r="2" />
                <line x1="4" y1="15" x2="20" y2="15" />
                <circle cx="14" cy="15" r="2" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Filter Bar - Shows when filter icon is clicked (UNDER divider) */}
        {showFiltersBar && (
          <div className="px-5 py-2">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              {filteredEvents.length} {t('eventsFound')}
            </p>
          </div>
        )}
        
        {/* Show event count when filter bar is hidden */}
        {!showFiltersBar && (
          <div className="px-5 py-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {filteredEvents.length} {t('eventsFound')}
            </p>
          </div>
        )}

        {/* Filter Bar - Shows when filter icon is clicked */}
        {showFiltersBar && (
          <div className="">
          {/* Filter Categories */}
          <div className="px-5 py-3 flex items-center justify-between gap-6 relative">
            {/* City */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('city')}
                className="text-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
                data-testid="filter-category-city"
              >
                {t('city')}
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'city' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'city' && (
                <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => { setSelectedCity('all'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted first:rounded-t-lg sticky top-0 bg-popover border-b border-border"
                    data-testid="city-option-all"
                  >
                    {t('allLocations')}
                  </button>
                  {customCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                      data-testid={`city-option-custom-${city.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {city}
                    </button>
                  ))}
                  {Object.entries(CITIES_BY_REGION).map(([region, countries]) => (
                    <div key={region}>
                      <div className="px-4 py-2 text-xs font-semibold text-foreground uppercase">
                        {region}
                      </div>
                      {Object.entries(countries).map(([country, cities]) => (
                        <div key={country}>
                          <div className="px-4 py-1 text-xs text-muted-foreground bg-background/50">
                            {country}
                          </div>
                          {cities.map((city) => (
                            <button
                              key={city}
                              onClick={() => { setSelectedCity(city); setActiveDropdown(null); }}
                              className="w-full text-left px-6 py-2 text-sm text-popover-foreground hover:bg-muted"
                              data-testid={`city-option-${city.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                  <button
                    onClick={() => { setShowAddCityDialog(true); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted last:rounded-b-lg border-t border-border sticky bottom-0 bg-popover"
                    data-testid="city-option-add"
                  >
                    {t('addCity')}
                  </button>
                </div>
              )}
            </div>

            {/* When */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('when')}
                className="text-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
                data-testid="filter-category-when"
              >
                {t('when')}
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'when' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'when' && (
                <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 min-w-[140px]">
                  {[
                    { key: 'Anytime', label: t('anytime') },
                    { key: 'Today', label: t('today') },
                    { key: 'This Week', label: t('thisWeek') },
                    { key: 'This Weekend', label: t('thisWeekend') },
                    { key: 'Next Week', label: t('nextWeek') },
                    { key: 'Next Month', label: t('nextMonth') }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedTimeFilter(key); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                      data-testid={`when-option-${key.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vibes */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('vibes')}
                className="text-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
                data-testid="filter-category-vibes"
              >
                {t('vibes')}
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'vibes' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'vibes' && (
                <div className="absolute top-full right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
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
                      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
                      data-testid={`vibe-option-${vibe.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {selectedEventTypes.includes(vibe) && <span className="text-foreground">✓</span>}
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
                className="ml-auto text-foreground hover:text-foreground transition-colors"
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
                    className="bg-muted text-foreground flex items-center gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs max-w-[45vw] sm:max-w-none"
                  >
                    <span className="truncate">{type}</span>
                    <button
                      onClick={() => setSelectedEventTypes(prev => prev.filter(t => t !== type))}
                      className="hover:text-foreground transition-colors flex-shrink-0"
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
        <main className="bg-background text-foreground pb-24">
          <div className="px-5 py-3">
            {/* Event Grid with Date Categories */}
            <div className="space-y-3">
              {/* Show event count below filter bar when it's visible */}
              {showFiltersBar && (
                <div className="pb-3">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {filteredEvents.length} {t('eventsFound')}
                  </p>
                </div>
              )}

            {isLoading ? (
              <EventGridSkeleton count={6} />
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-lg text-muted-foreground mb-4">{t('noEventsMatchCriteria')}</p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedEventTypes([]);
                }}>
                  {t('clearFilters')}
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('today')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('thisWeek')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('thisWeekend')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('nextWeek')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('nextWeekend')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('thisMonth')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('upcomingEvents')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('today')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('thisWeek')}</h2>
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
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('thisWeekend')}</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.thisWeekend.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedTimeFilter === 'Next Week' && groupedEvents.nextWeek.length > 0 && (
                      <div className="space-y-4">
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('nextWeek')}</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.nextWeek.map((event: any) => (
                            <IOSEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedTimeFilter === 'Next Month' && groupedEvents.month.length > 0 && (
                      <div className="space-y-4">
                        <div className="pb-2">
                          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('nextMonth')}</h2>
                        </div>
                        <div className="space-y-4">
                          {groupedEvents.month.map((event: any) => (
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
                    <p className="text-lg text-muted-foreground mb-4">{t('noEventsMatchCriteria')}</p>
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setSelectedEventTypes([]);
                    }}>
                      {t('clearFilters')}
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
                      <p className="text-sm text-muted-foreground">{t('scrollForMore')}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
      {/* Scrollable content area end */}
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}