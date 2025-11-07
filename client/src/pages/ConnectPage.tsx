
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translations";
import { useLocation, Link } from "wouter";
import { Filter, X, Inbox, UserPlus, Loader2, MapPin, ChevronDown, UserCheck, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DIGITAL_NOMAD_CITIES, VIBE_AND_MOOD_TAGS } from "@/lib/constants";

// User interface matching the existing ConnectPage User type
interface ConnectUser {
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
  currentMoods?: string[] | string | null;
  profession?: string | null;
  age?: number | null;
  createdAt?: Date | string | null;
  tags?: string[];
}

interface ConnectionStatus {
  outgoing: {
    status: string;
    date: string;
  } | null;
  incoming: {
    status: string;
    date: string;
  } | null;
}

export function ConnectPage() {
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedVibe, setSelectedVibe] = useState<string>("all");
  const [showFiltersBar, setShowFiltersBar] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<number, ConnectionStatus>>({});
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real users from the API
  const { user: currentUser } = useUser();
  const {
    data: users,
    isLoading,
    error
  } = useQuery<ConnectUser[]>({
    queryKey: ['users', selectedCity, selectedGender, selectedVibe, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (selectedCity !== 'all') {
        params.append('location', selectedCity);
      }

      if (selectedGender !== 'all') {
        params.append('gender', selectedGender);
      }

      if (selectedVibe !== 'all') {
        params.append('moods', selectedVibe);
      }

      if (currentUser?.id) {
        params.append('currentUserId', currentUser.id.toString());
      }
      
      const response = await fetch(`/api/users/browse?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const results = await response.json();
      return results.users || results;
    },
    refetchOnWindowFocus: false
  });


  // Fetch connection statuses for all users
  useEffect(() => {
    const fetchConnectionStatuses = async () => {
      if (!users || !currentUser) return;
      
      const statuses: Record<number, ConnectionStatus> = {};
      
      await Promise.all(
        users.map(async (user) => {
          if (user.id === currentUser.id) return;
          
          try {
            const response = await fetch(`/api/connections/status/${user.id}`);
            if (response.ok) {
              statuses[user.id] = await response.json();
            }
          } catch (error) {
            console.error(`Failed to fetch connection status for user ${user.id}:`, error);
          }
        })
      );
      
      setConnectionStatuses(statuses);
    };
    
    fetchConnectionStatuses();
  }, [users, currentUser]);

  // Create a connection request
  const createConnectionMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send connection request');
      }
      
      return response.json();
    },
    onSuccess: (_, targetUserId) => {
      toast({
        title: 'Connection request sent',
        description: 'Your connection request has been sent successfully.',
      });
      
      // Optimistically update connection status
      setConnectionStatuses(prev => ({
        ...prev,
        [targetUserId]: {
          outgoing: { status: 'pending', date: new Date().toISOString() },
          incoming: null
        }
      }));
      
      queryClient.invalidateQueries({ queryKey: ['connection-status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error sending request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Accept a connection request
  const respondToConnectionMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: 'accepted' | 'declined' }) => {
      const response = await fetch(`/api/connections/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${status} connection request`);
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === 'accepted' ? 'Connection accepted' : 'Connection declined',
        description: variables.status === 'accepted' 
          ? 'You are now connected with this user.' 
          : 'You have declined this connection request.',
      });
      queryClient.invalidateQueries({ queryKey: ['connection-status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create or find a conversation with another user
  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Navigate to the conversation page with the conversation ID
      if (data?.id) {
        setLocation(`/chat/conversation/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error starting conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUserClick = (user: ConnectUser) => {
    setLocation(`/profile/${user.username}`);
  };

  // Handle filter button click
  const handleFilterClick = () => {
    setShowFiltersBar(!showFiltersBar);
    setActiveDropdown(null);
  };

  // Filter management functions
  const clearAllFilters = () => {
    setSelectedCity("all");
    setSelectedGender("all");
    setSelectedVibe("all");
    setActiveDropdown(null);
  };

  const removeFilter = (filterType: string) => {
    if (filterType === "city") {
      setSelectedCity("all");
    } else if (filterType === "gender") {
      setSelectedGender("all");
    } else if (filterType === "vibe") {
      setSelectedVibe("all");
    }
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (selectedCity !== "all") {
      filters.push({ type: "city", label: selectedCity, value: selectedCity });
    }
    if (selectedGender !== "all") {
      filters.push({ type: "gender", label: selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1), value: selectedGender });
    }
    if (selectedVibe !== "all") {
      filters.push({ type: "vibe", label: selectedVibe, value: selectedVibe });
    }
    return filters;
  };

  // Toggle dropdown
  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };


  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header Section - Match Discover Page Style */}
      <header className="bg-black text-white sticky top-0 z-50">
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
            {/* Connect title with gradient - uppercase with extra letter spacing */}
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>Connect</h2>
            
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
          
          {/* Show profile count here when filter bar is hidden */}
          {!showFiltersBar && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {users?.length || 0} {users?.length === 1 ? 'profile' : 'profiles'} found
            </p>
          )}
        </div>
      </header>

      {/* Filter Bar - Shows when filter icon is clicked */}
      {showFiltersBar && (
        <div className="bg-black border-b border-gray-800">
          {/* Filter Categories */}
          <div className="px-5 py-3 flex items-center justify-between gap-6 relative">
            {/* Gender */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('gender')}
                className="text-white text-sm hover:text-purple-400 transition-colors flex items-center gap-1"
                data-testid="filter-category-gender"
              >
                Gender
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'gender' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Gender Dropdown */}
              {activeDropdown === 'gender' && (
                <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[120px]">
                  <button
                    onClick={() => { setSelectedGender('all'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 first:rounded-t-lg"
                    data-testid="gender-option-all"
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setSelectedGender('male'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
                    data-testid="gender-option-male"
                  >
                    Male
                  </button>
                  <button
                    onClick={() => { setSelectedGender('female'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
                    data-testid="gender-option-female"
                  >
                    Female
                  </button>
                  <button
                    onClick={() => { setSelectedGender('other'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 last:rounded-b-lg"
                    data-testid="gender-option-other"
                  >
                    Other
                  </button>
                </div>
              )}
            </div>

            {/* City */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('location')}
                className="text-white text-sm hover:text-purple-400 transition-colors flex items-center gap-1"
                data-testid="filter-category-location"
              >
                City
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'location' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* City Dropdown */}
              {activeDropdown === 'location' && (
                <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => { setSelectedCity('all'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 first:rounded-t-lg sticky top-0 bg-gray-900"
                    data-testid="location-option-all"
                  >
                    All Cities
                  </button>
                  {DIGITAL_NOMAD_CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
                      data-testid={`location-option-${city.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vibe */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('vibe')}
                className="text-white text-sm hover:text-purple-400 transition-colors flex items-center gap-1"
                data-testid="filter-category-vibe"
              >
                Vibe
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'vibe' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Vibe Dropdown */}
              {activeDropdown === 'vibe' && (
                <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => { setSelectedVibe('all'); setActiveDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 first:rounded-t-lg sticky top-0 bg-gray-900"
                    data-testid="vibe-option-all"
                  >
                    All Vibes
                  </button>
                  {VIBE_AND_MOOD_TAGS.map((vibe) => (
                    <button
                      key={vibe}
                      onClick={() => { setSelectedVibe(vibe); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
                      data-testid={`vibe-option-${vibe.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear All X */}
            {getActiveFilters().length > 0 && (
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
          {getActiveFilters().length > 0 && (
            <div className="px-5 pb-3">
              <div className="flex flex-wrap gap-2">
                {getActiveFilters().map((filter) => (
                  <Badge
                    key={`${filter.type}-${filter.value}`}
                    variant="secondary"
                    className="bg-gray-800 text-white flex items-center gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs max-w-[45vw] sm:max-w-none"
                    data-testid={`filter-badge-${filter.type}`}
                  >
                    <span className="truncate">{filter.label}</span>
                    <button
                      onClick={() => removeFilter(filter.type)}
                      className="hover:text-purple-400 transition-colors flex-shrink-0"
                      data-testid={`remove-filter-${filter.type}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Show profile count below filter bar when it's visible */}
          <div className="px-5 pb-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {users?.length || 0} {users?.length === 1 ? 'profile' : 'profiles'} found
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        {isLoading ? (
          <div className="text-center py-8">
            <span className="text-gray-400">Loading users...</span>
          </div>
        ) : (
          /* List View - Similar to Discover Page */
          <div className="px-4 py-3">
            <div className="space-y-3">
              {(users || []).map((user) => {
                // Get connection status for this user
                const connectionStatus = connectionStatuses[user.id];
                const isConnected = connectionStatus?.outgoing?.status === 'accepted' || 
                                   connectionStatus?.incoming?.status === 'accepted';
                const isPending = connectionStatus?.outgoing?.status === 'pending';

                // Get first mood/vibe
                const userVibe = Array.isArray(user.currentMoods) && user.currentMoods.length > 0
                  ? user.currentMoods[0]
                  : typeof user.currentMoods === 'string'
                  ? user.currentMoods
                  : null;

                return (
                  <div 
                    key={user.id}
                    className="flex gap-4 p-2 hover:bg-gray-900/20 rounded-lg transition-colors"
                    data-testid={`user-card-${user.id}`}
                  >
                    {/* User Image */}
                    <div 
                      className="w-40 h-40 bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullName || user.username}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/80 to-blue-900/80 flex items-center justify-center">
                          <span className="text-6xl font-bold text-white/40">
                            {(user.fullName || user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* User Details */}
                    <div className="flex-1 flex flex-col justify-start space-y-1 sm:space-y-2 min-w-0">
                      <h3 
                        className="text-sm sm:text-base md:text-lg font-medium text-white leading-tight line-clamp-1 cursor-pointer hover:text-purple-400"
                        onClick={() => handleUserClick(user)}
                      >
                        {user.fullName || user.username}
                      </h3>
                      
                      {userVibe && (
                        <p className="text-xs sm:text-sm text-white/80 line-clamp-1">
                          {userVibe}
                        </p>
                      )}
                      
                      {user.location && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-white/80">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="line-clamp-1">{user.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Connect Button */}
                    {currentUser && user.id !== currentUser.id && (
                      <div className="flex items-center ml-1 sm:ml-2">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isConnected && !isPending) {
                              createConnectionMutation.mutate(user.id);
                            }
                          }}
                          disabled={createConnectionMutation.isPending || isConnected}
                          className={
                            isConnected || isPending
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-4 whitespace-nowrap"
                              : "bg-transparent border border-purple-500 text-purple-400 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-4 whitespace-nowrap transition-all"
                          }
                          data-testid={`connect-button-${user.id}`}
                        >
                          {createConnectionMutation.isPending ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : isConnected ? (
                            <>
                              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Connected</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Pending</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Connect</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {(!users || users.length === 0) && (
                <div className="text-center py-8">
                  <span className="text-gray-400">No users found</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default ConnectPage;
