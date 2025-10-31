
import { useState } from "react";
import { useTranslation } from "@/lib/translations";
import { useLocation, Link } from "wouter";
import { Filter, X, Mail, UserPlus, Loader2, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIGITAL_NOMAD_CITIES } from "@/lib/constants";
import PremiumPaywall from "@/components/PremiumPaywall";

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
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [tempSelectedCity, setTempSelectedCity] = useState<string>("all");
  const [tempSelectedGender, setTempSelectedGender] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
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
    queryKey: ['users', selectedCity, selectedGender, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (selectedCity !== 'all') {
        params.append('location', selectedCity);
      }

      if (selectedGender !== 'all') {
        params.append('gender', selectedGender);
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
    onSuccess: () => {
      toast({
        title: 'Connection request sent',
        description: 'Your connection request has been sent successfully.',
      });
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

  // Handle filter button click - check premium status first
  const handleFilterClick = () => {
    if (currentUser?.isPremium) {
      setShowFiltersModal(true);
    } else {
      setShowPremiumPaywall(true);
    }
  };

  // Filter management functions
  const applyFilters = () => {
    setSelectedCity(tempSelectedCity);
    setSelectedGender(tempSelectedGender);
    setShowFiltersModal(false);
  };

  const clearAllFilters = () => {
    setTempSelectedCity("all");
    setTempSelectedGender("all");
    setSelectedCity("all");
    setSelectedGender("all");
    setShowFiltersModal(false);
  };

  const removeFilter = (filterType: string) => {
    if (filterType === "city") {
      setSelectedCity("all");
    } else if (filterType === "gender") {
      setSelectedGender("all");
    }
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (selectedCity !== "all") {
      filters.push({ type: "city", label: selectedCity, value: selectedCity });
    }
    if (selectedGender !== "all") {
      filters.push({ type: "gender", label: selectedGender, value: selectedGender });
    }
    return filters;
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
            <Mail className="h-7 w-7" />
          </Button>
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            {/* Connect title with gradient */}
            <h2 className="gradient-text text-lg font-medium">Connect</h2>
            
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
      </header>

      {/* Active Filters Display */}
      {getActiveFilters().length > 0 && (
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="flex flex-wrap gap-2">
            {getActiveFilters().map((filter) => (
              <Badge
                key={`${filter.type}-${filter.value}`}
                variant="secondary"
                className="bg-gray-700 text-white flex items-center gap-1 px-3 py-1"
                data-testid={`filter-tag-${filter.type}`}
              >
                <span className="text-xs">{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter.type)}
                  className="ml-1 hover:bg-gray-600 rounded-full p-0.5"
                  data-testid={`remove-filter-${filter.type}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
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
                // Prepare user connection status
                const getUserConnectionStatus = (userId: number) => {
                  if (!currentUser || userId === currentUser.id) return null;
                  return null; // We'll load individual statuses on demand
                };

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
                    <div className="flex-1 flex flex-col justify-start space-y-2 min-w-0">
                      <h3 
                        className="text-lg font-medium text-white leading-tight line-clamp-1 cursor-pointer hover:text-purple-400"
                        onClick={() => handleUserClick(user)}
                      >
                        {user.fullName || user.username}
                      </h3>
                      
                      {userVibe && (
                        <p className="text-sm text-white/80 line-clamp-1">
                          {userVibe}
                        </p>
                      )}
                      
                      {user.location && (
                        <div className="flex items-center gap-1 text-sm text-white/80">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="line-clamp-1">{user.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Connect Button */}
                    {currentUser && user.id !== currentUser.id && (
                      <div className="flex items-center ml-2">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            createConnectionMutation.mutate(user.id);
                          }}
                          disabled={createConnectionMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm py-2 px-4 whitespace-nowrap"
                          data-testid={`connect-button-${user.id}`}
                        >
                          {createConnectionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Connect
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

      {/* Filters Modal */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="bg-black text-white border-gray-800 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-medium text-center">Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Singles near me section */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Singles near me</h3>
              <Select value={tempSelectedCity} onValueChange={setTempSelectedCity}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white" data-testid="city-filter-select">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 z-[9999]">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">All cities</SelectItem>
                  {DIGITAL_NOMAD_CITIES.map((city) => (
                    <SelectItem 
                      key={city} 
                      value={city} 
                      className="text-white hover:bg-gray-700"
                      data-testid={`city-option-${city.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender section */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Gender</h3>
              <Select value={tempSelectedGender} onValueChange={setTempSelectedGender}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white" data-testid="gender-filter-select">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 z-[9999]">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">All genders</SelectItem>
                  <SelectItem value="male" className="text-white hover:bg-gray-700">Male</SelectItem>
                  <SelectItem value="female" className="text-white hover:bg-gray-700">Female</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-gray-700">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                onClick={clearAllFilters}
                data-testid="clear-all-button"
              >
                Clear All
              </Button>
              <Button
                className="flex-1 bg-white text-black hover:bg-gray-200"
                onClick={applyFilters}
                data-testid="apply-filters-button"
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Paywall */}
      <PremiumPaywall 
        isOpen={showPremiumPaywall} 
        onClose={() => setShowPremiumPaywall(false)} 
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default ConnectPage;
