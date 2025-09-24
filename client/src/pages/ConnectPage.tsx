
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/translations";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, MapPin, Search, Filter, UserCircle, Heart, X, ChevronDown } from "lucide-react";
import { GradientHeader } from "@/components/ui/GradientHeader";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
// Carousel imports removed as they're no longer needed

// Mood badge styles configuration
// User interface based on the database schema
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  profileType?: string;
  gender?: string | null;
  sexualOrientation?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  profileImages?: string[];
  location?: string | null;
  birthLocation?: string | null;
  nextLocation?: string | null;
  interests?: string[] | null;
  // Important: currentMoods can be in multiple formats from the database
  currentMoods?: string[] | string | null;
  profession?: string | null;
  age?: number | null;
  createdAt?: Date | string | null;
  // Additional fields to match events
  tags?: string[]; // We will map currentMoods to tags for consistent filtering
}

const moodStyles = {
  // New vibe and mood tags
  "Party & Nightlife": "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  "Fashion & Style": "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30",
  "Networking & Business": "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  "Dining & Drinks": "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  "Outdoor & Nature": "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
  "Wellness & Fitness": "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30",
  "Creative & Artsy": "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30",
  "Single & Social": "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30",
  "Chill & Recharge": "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30",
  "Adventure & Exploring": "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
  "Spiritual & Intentional": "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
  
  // Keep legacy styles for backward compatibility
  "Dating": "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30",
  "Networking": "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  "Parties": "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  "Adventure": "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
  "Dining Out": "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  "Working": "bg-slate-500/20 text-slate-500 hover:bg-slate-500/30",
  "Exploring": "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
  "Learning": "bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30", 
  "Teaching": "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
  "Socializing": "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30",
  "Focusing": "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30",
  "Relaxing": "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30",
  "Creating": "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30"
} as const;

const cities = [
  "Bali",
  "Bangkok",
  "Barcelona",
  "Berlin",
  "Lisbon",
  "London",
  "Mexico City",
  "New York",
];

const interests = [
  "Travel",
  "Digital Marketing",
  "Photography",
  "Entrepreneurship",
  "Tech",
  "Fitness",
  "Art",
  "Music",
  "Food",
  "Fashion"
];

import { useUser } from "@/hooks/use-user";
import { VIBE_AND_MOOD_TAGS } from "@/lib/constants";

// Use the same EVENT_TYPES constant as the Discover page uses
const EVENT_TYPES = VIBE_AND_MOOD_TAGS;
const moods = EVENT_TYPES; // For backward compatibility

export function ConnectPage() {
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch real users from the API
  const { user: currentUser } = useUser();
  const {
    data: users,
    isLoading,
    error,
    refetch
  } = useQuery<User[]>({
    queryKey: ['users', selectedCity, currentUser?.id],
    queryFn: async () => {
      // Build query parameters - now only using location/city filter
      const params = new URLSearchParams();
      
      if (selectedCity !== 'all') {
        params.append('location', selectedCity);
      }

      if (currentUser?.id) {
        params.append('currentUserId', currentUser.id.toString());
      }
      
      // Log the query for debugging
      const queryString = params.toString();
      console.log(`Fetching users with filters: ${queryString}`);
      
      // Use the properly formatted query string - no longer sending moods in the API call
      const response = await fetch(`/api/users/browse?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const results = await response.json();
      const usersList = results.users || results; // Handle both array and object responses
      console.log(`Received ${usersList.length} users from server`);
      
      // Process users to ensure they have tags for compatibility with event filtering
      const processedUsers = usersList.map((user: User) => {
        // Create tags array from BOTH interests and currentMoods for compatibility with event filtering
        let moodArray: string[] = [];
        
        // First check interests since you mentioned that's where they're stored
        if (user.interests) {
          if (Array.isArray(user.interests)) {
            moodArray = [...user.interests];
          } else if (typeof user.interests === 'string') {
            try {
              // Try parsing as JSON string
              const parsed = JSON.parse(user.interests as string);
              if (Array.isArray(parsed)) {
                moodArray = [...parsed];
              }
            } catch (e) {
              // If it fails, try treating as comma-separated string
              if (typeof user.interests === 'string') {
                moodArray = (user.interests as string).split(',').map((m: string) => m.trim());
              }
            }
          }
        }
        
        // Also check currentMoods as a backup
        if (user.currentMoods) {
          let currentMoodsArray: string[] = [];
          
          if (Array.isArray(user.currentMoods)) {
            currentMoodsArray = user.currentMoods;
          } else if (typeof user.currentMoods === 'string') {
            try {
              // Try parsing as JSON string
              const parsed = JSON.parse(user.currentMoods as string);
              if (Array.isArray(parsed)) {
                currentMoodsArray = parsed;
              }
            } catch (e) {
              // If it fails, try treating as comma-separated string
              if (typeof user.currentMoods === 'string') {
                currentMoodsArray = (user.currentMoods as string).split(',').map((m: string) => m.trim());
              }
            }
          }
          
          // Merge with interests
          moodArray = [...moodArray, ...currentMoodsArray];
        }
        
        // Debug log to check what moods/interests we found
        console.log(`User ${user.fullName || user.username}:`, {
          interests: user.interests,
          currentMoods: user.currentMoods,
          combinedTags: moodArray
        });
        
        // Add tags property for compatibility with event filtering
        return {
          ...user,
          tags: moodArray // This makes filtering work exactly like in the Discover page
        };
      });
      
      // Debug: Check the structure after processing
      processedUsers.forEach((user: User) => {
        console.log(`User ${user.fullName || user.username} has tags:`, user.tags);
      });
      
      return processedUsers;
    },
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  // Filter users exactly like the Discover page filters events
  const filteredUsers = users?.filter(user => {
    // Check if user matches search term
    const matchesSearch = !searchTerm || 
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Use the tags property we added during API response processing
    // This makes it work EXACTLY like the Discover page filter
    const matchesMoods = selectedMoods.length === 0 ||
                      (user.tags?.some(tag => selectedMoods.includes(tag)));
    
    // Debug logs to understand filtering
    if (selectedMoods.length > 0) {
      console.log(`User ${user.fullName || user.username} has tags:`, 
        user.tags, 
        `Matches filters (${selectedMoods.join(', ')}):`, 
        matchesMoods);
    }
    
    // Both conditions must be satisfied, exactly like in Discover page
    return matchesSearch && matchesMoods;
  }) || [];

  const toggleFilter = (item: string) => {
    setSelectedMoods(prev => {
      const newMoods = prev.includes(item) 
        ? prev.filter(i => i !== item) 
        : [...prev, item];
      console.log(`Updated moods: ${newMoods.join(', ')}`);
      return newMoods;
    });
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <GradientHeader
        title={t('connect')}
        backButtonFallbackPath="/discover"
      >
        <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
          <Link href="/connections">
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm h-8">
              <UserCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{t('connections')}</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm h-8"
          >
            <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{t('filters')}</span>
            {selectedMoods.length > 0 && (
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs px-1.5">
                {selectedMoods.length}
              </Badge>
            )}
          </Button>
        </div>
      </GradientHeader>

      <div className="mb-8 space-y-4">
        {/* Selected Filters Display - Shown even when filters are hidden */}
        {selectedMoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 py-3 sm:py-4">
            {selectedMoods.map((mood) => (
              <Badge
                key={mood}
                variant="secondary"
                className="px-2 sm:px-3 py-0.5 sm:py-1 flex items-center gap-0.5 sm:gap-1 text-xs"
              >
                {t(mood)}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedMoods(prev => prev.filter(m => m !== mood));
                  }}
                  className="ml-0.5 sm:ml-1 hover:text-destructive focus:outline-none"
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMoods([])}
              className="text-muted-foreground hover:text-foreground text-xs sm:text-sm h-6 sm:h-8 px-2 sm:px-3"
            >
              {t('clearAll')}
            </Button>
          </div>
        )}

        {/* Expanded filters section */}
        {isFiltersVisible && (
          <div className="space-y-3 sm:space-y-4 bg-accent/5 p-3 sm:p-4 rounded-lg border border-border">
            {/* City Filter */}
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-xs sm:text-sm font-medium">{t('cities')}</h3>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full bg-background/5 border-border h-9 text-xs sm:text-sm flex justify-between items-center">
                  <SelectValue placeholder={t('selectCity')} />
                  {/* Removed duplicate ChevronDown icon */}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCities')}</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Vibe and Mood Filter */}
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-xs sm:text-sm font-medium">{t('vibe')}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-9 text-xs sm:text-sm px-2 sm:px-4"
                  >
                    <span className="truncate">{t('selectVibes')}</span>
                    <div className="flex items-center">
                      {selectedMoods.length > 0 && (
                        <Badge variant="secondary" className="mr-1.5 text-xs px-1.5">
                          {selectedMoods.length}
                        </Badge>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px] sm:w-[280px]">
                  <DropdownMenuLabel className="text-xs sm:text-sm">{t('findPeopleWithSimilarVibes')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                    {moods.map((mood) => (
                      <DropdownMenuCheckboxItem
                        key={mood}
                        checked={selectedMoods.includes(mood)}
                        onCheckedChange={(checked) => {
                          console.log(`Updated moods: ${checked ? [...selectedMoods, mood].join(", ") : selectedMoods.filter(m => m !== mood).join(", ")}`);
                          setSelectedMoods(prev =>
                            checked
                              ? [...prev, mood]
                              : prev.filter(m => m !== mood)
                          );
                        }}
                        className="text-xs sm:text-sm"
                      >
                        {t(mood)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                  {selectedMoods.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="justify-center text-muted-foreground text-xs sm:text-sm"
                        onClick={() => setSelectedMoods([])}
                      >
                        {t('clearAll')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Search by name */}
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-xs sm:text-sm font-medium">{t('searchByName')}</h3>
              <div className="relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchByName')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Display selected filters count if any */}
        {selectedMoods.length > 0 && (
          <div className="py-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {filteredUsers.length} People Found
            </h2>
          </div>
        )}
      </div>

      {/* User profile grid display */}
      <div className="w-full">
        {isLoading ? (
          // Loading skeletons in grid format
          <div className="grid gap-4 gap-y-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
            {Array(8).fill(0).map((_, index) => (
              <Card key={index} className="overflow-hidden h-full w-full">
                <CardContent className="p-0">
                  <div className="flex flex-col h-full">
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          // Real users from database in grid format
          <div className="grid gap-4 gap-y-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
            {filteredUsers.map((user) => (
              <Link 
                key={user.id}
                href={`/profile/${user.username}`} 
                className="block h-full"
              >
                <Card className="overflow-hidden hover:bg-accent/5 transition-colors cursor-pointer group h-full">
                  <CardContent className="p-0">
                    <div className="flex flex-col h-full">
                      <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.fullName || user.username}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <UserCircle className="h-20 w-20 text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-base text-white truncate">
                                {/* Name doesn't need t() function since it's personal data */}
                                {user.fullName || user.username}
                                {/* Age is not displayed as requested */}
                              </h3>
                            </div>
                            {user.location && (
                              <div className="flex items-center text-xs text-white/80">
                                <MapPin className="h-2.5 w-2.5 mr-1" />
                                <span className="truncate">{user.location}</span>
                              </div>
                            )}
                            {user.tags && user.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {user.tags.slice(0, 2).map((mood, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className={`${moodStyles[mood as keyof typeof moodStyles] || 'bg-secondary'} text-xs text-[10px]`}
                                  >
                                    {t(mood)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          // No users found
          <div className="py-12 text-center w-full">
            <p className="text-muted-foreground text-lg">No users found matching your criteria.</p>
            <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedMoods([]);
                setSelectedCity("all"); 
              }}
              className="mt-4"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
      <div className="py-8 border-y border-border/10 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-4">
            Premium Ad Partner
          </p>
          <img
            src="/attached_assets/Screenshot 2025-03-05 at 8.09.43 AM.png"
            alt="Premium Ad Partner"
            className="w-full max-w-md mx-auto h-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default ConnectPage;
