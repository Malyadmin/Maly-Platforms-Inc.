
import { useState } from "react";
import { useTranslation } from "@/lib/translations";
import { useLocation, Link } from "wouter";
import { Search, ChevronDown, User, Filter, X, Grid3X3, ChevronLeft, ChevronRight, ArrowLeft, Mail, Briefcase, UserPlus, Check, UserCheck, Loader2, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCard } from "@/components/ui/user-card";
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
  const [showSearch, setShowSearch] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [tempSelectedCity, setTempSelectedCity] = useState<string>("all");
  const [tempSelectedGender, setTempSelectedGender] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"single" | "grid">("grid");
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
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

  // Reset current user index when users change
  if (users && users.length > 0 && currentUserIndex >= users.length) {
    setCurrentUserIndex(0);
  }

  // Get current profile being viewed
  const getCurrentUser = () => {
    if (!users || users.length === 0) return null;
    return users[currentUserIndex];
  };

  const profileData = getCurrentUser();

  // Get the connection status between current user and profile user
  const {
    data: connectionStatus,
    isLoading: connectionLoading,
  } = useQuery<ConnectionStatus>({
    queryKey: ['connection-status', profileData?.id, currentUser?.id],
    queryFn: async () => {
      if (!profileData?.id || !currentUser?.id) {
        return { outgoing: null, incoming: null };
      }
      const response = await fetch(`/api/connections/status/${profileData.id}`);
      if (!response.ok) throw new Error('Failed to fetch connection status');
      return response.json();
    },
    enabled: !!profileData?.id && !!currentUser?.id,
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
      queryClient.invalidateQueries({ queryKey: ['connection-status', profileData?.id, currentUser?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['connection-status', profileData?.id, currentUser?.id] });
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

  // Navigation functions for single user view
  const nextUser = () => {
    if (users && users.length > 0) {
      setCurrentUserIndex((prev) => (prev + 1) % users.length);
    }
  };

  const prevUser = () => {
    if (users && users.length > 0) {
      setCurrentUserIndex((prev) => (prev - 1 + users.length) % users.length);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header Section */}
      <header className="bg-black">
        {/* MALY logo centered at top */}
        <div className="flex justify-center pt-3 pb-4">
          <h1 className="text-white text-xl font-bold tracking-[0.3em] leading-none" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>MÁLY</h1>
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between">
            {/* Connect title */}
            <h2 className="text-white text-lg font-medium">Connect</h2>
            
            {/* Filter and Search icons */}
            <div className="flex items-center gap-2">
              <button 
                className="p-1"
                onClick={handleFilterClick}
                data-testid="filters-button"
              >
                <Filter className="h-6 w-6 text-white" />
              </button>
              <button 
                className="p-1"
                onClick={() => setShowSearch(!showSearch)}
                data-testid="search-button"
              >
                <Search className="h-6 w-6 text-white" />
              </button>
            </div>
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
      <main className="flex-1">
        {isLoading ? (
          <div className="text-center py-8">
            <span className="text-gray-400">Loading users...</span>
          </div>
        ) : viewMode === "single" ? (
          /* Single User View - Fullscreen Profile */
          <div className="relative">
            {profileData ? (
              <div>

                {/* Navigation arrows */}
                {users && users.length > 1 && (
                  <>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                      <Button
                        variant="ghost"
                        className="text-white bg-black/50 backdrop-blur-sm rounded-full p-2 h-auto"
                        onClick={prevUser}
                        data-testid="prev-user-button"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                      <Button
                        variant="ghost"
                        className="text-white bg-black/50 backdrop-blur-sm rounded-full p-2 h-auto"
                        onClick={nextUser}
                        data-testid="next-user-button"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Profile Image with Overlay */}
                <div className="relative w-full h-[75vh]">
                  {profileData.profileImage ? (
                    <div className="absolute inset-0">
                      <img 
                        src={profileData.profileImage} 
                        alt={profileData.fullName || profileData.username}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-blue-900/80 to-black/90 flex items-center justify-center">
                      <div className="text-9xl font-bold text-white/20">
                        {profileData.username[0].toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Profile info overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
                    <div className="space-y-3">
                      <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        {profileData.fullName || profileData.username}
                      </h1>
                      
                      <div className="flex flex-wrap gap-2">
                        {profileData.location && (
                          <Badge className="bg-white/20 hover:bg-white/30 text-white py-2 px-3 text-sm backdrop-blur-sm border-0">
                            <MapPin className="h-4 w-4 mr-2" />
                            {profileData.location}
                          </Badge>
                        )}
                        
                        {profileData.profession && (
                          <Badge className="bg-white/20 hover:bg-white/30 text-white py-2 px-3 text-sm backdrop-blur-sm border-0">
                            <Briefcase className="h-4 w-4 mr-2" />
                            {profileData.profession}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Connection Button */}
                    {currentUser && profileData.id !== currentUser.id && (
                      <div className="w-full">
                        {connectionLoading ? (
                          <Button disabled className="w-full bg-white/20 backdrop-blur-sm text-white border-0">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading
                          </Button>
                        ) : connectionStatus?.outgoing?.status === 'accepted' || connectionStatus?.incoming?.status === 'accepted' ? (
                          <div className="flex gap-2 w-full">
                            <Button variant="secondary" className="gap-2 bg-green-500/30 backdrop-blur-sm text-white border-0 flex-1" disabled>
                              <UserCheck className="h-4 w-4" />
                              Connected
                            </Button>
                            <Button 
                              onClick={() => createConversationMutation.mutate(profileData.id)}
                              disabled={createConversationMutation.isPending}
                              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex-1 rounded-full border-0"
                              data-testid="button-message"
                            >
                              {createConversationMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                              Message
                            </Button>
                          </div>
                        ) : connectionStatus?.outgoing?.status === 'pending' ? (
                          <Button variant="secondary" className="gap-2 bg-yellow-500/30 backdrop-blur-sm text-white border-0 w-full" disabled>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Request Pending
                          </Button>
                        ) : connectionStatus?.incoming?.status === 'pending' ? (
                          <div className="flex gap-2 w-full">
                            <Button 
                              variant="default" 
                              className="gap-1 bg-green-600 hover:bg-green-700 flex-1 border-0"
                              onClick={() => respondToConnectionMutation.mutate({ 
                                userId: profileData.id, 
                                status: 'accepted' 
                              })}
                              disabled={respondToConnectionMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                              Accept
                            </Button>
                            <Button 
                              variant="secondary" 
                              className="gap-1 bg-red-500/30 backdrop-blur-sm text-white border-0 hover:bg-red-500/40 flex-1"
                              onClick={() => respondToConnectionMutation.mutate({ 
                                userId: profileData.id, 
                                status: 'declined' 
                              })}
                              disabled={respondToConnectionMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => createConnectionMutation.mutate(profileData.id)}
                            disabled={createConnectionMutation.isPending}
                            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full rounded-full border-0"
                          >
                            {createConnectionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                            Connect
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* More Info Button */}
                    <Button 
                      onClick={() => setShowMoreInfo(!showMoreInfo)}
                      variant="secondary"
                      className="w-full gap-2 bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30"
                    >
                      {showMoreInfo ? 'Less Info' : 'More Info'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`} />
                    </Button>

                    {/* User indicator */}
                    {users && users.length > 1 && (
                      <div className="flex justify-center mt-4 space-x-1">
                        {users.slice(0, Math.min(users.length, 10)).map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentUserIndex ? "bg-white" : "bg-gray-600"
                            }`}
                          />
                        ))}
                        {users.length > 10 && (
                          <span className="text-gray-400 text-xs ml-2">
                            {currentUserIndex + 1} / {users.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible More Info Section */}
                {showMoreInfo && (
                  <div className="bg-black/90 backdrop-blur-sm">
                    <div className="container mx-auto px-4 sm:px-6 py-6">
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6">
                          {/* Bio */}
                          {profileData.bio && (
                            <div className="mb-6">
                              <h3 className="text-lg font-medium text-white mb-3">About</h3>
                              <p className="text-base text-white/80">{profileData.bio}</p>
                            </div>
                          )}
                          
                          {/* Personal Details */}
                          <div className="space-y-6">
                            {/* Gender & Sexual Orientation */}
                            {(profileData.gender || profileData.sexualOrientation) && (
                              <div>
                                <h3 className="text-lg font-medium text-white mb-3">Personal</h3>
                                <div className="flex flex-wrap gap-2">
                                  {profileData.gender && (
                                    <Badge className="bg-white/20 text-white py-2 px-3 text-sm border-0">
                                      Gender: {profileData.gender}
                                    </Badge>
                                  )}
                                  {profileData.sexualOrientation && (
                                    <Badge className="bg-white/20 text-white py-2 px-3 text-sm border-0">
                                      Orientation: {profileData.sexualOrientation}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Interests */}
                            {profileData.interests && profileData.interests.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-white mb-3">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                  {profileData.interests.map((interest) => (
                                    <Badge key={interest} className="bg-white/20 text-white py-1 px-3 text-sm border-0">
                                      {interest}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Current Moods */}
                            {profileData.currentMoods && (
                              <div>
                                <h3 className="text-lg font-medium text-white mb-3">Current Vibes</h3>
                                <div className="flex flex-wrap gap-2">
                                  {Array.isArray(profileData.currentMoods) 
                                    ? profileData.currentMoods.map((mood) => (
                                        <Badge key={mood} className="bg-white/20 text-white py-1 px-3 text-sm border-0">
                                          {mood}
                                        </Badge>
                                      ))
                                    : (
                                        <Badge className="bg-white/20 text-white py-1 px-3 text-sm border-0">
                                          {profileData.currentMoods}
                                        </Badge>
                                      )
                                  }
                                </div>
                              </div>
                            )}

                            {/* Locations */}
                            {(profileData.birthLocation || profileData.nextLocation) && (
                              <div>
                                <h3 className="text-lg font-medium text-white mb-3">Locations</h3>
                                <div className="space-y-3">
                                  {profileData.birthLocation && (
                                    <div className="flex items-center gap-3 text-sm">
                                      <MapPin className="h-4 w-4 text-blue-400" />
                                      <span className="text-white/80">From <span className="font-medium text-white">{profileData.birthLocation}</span></span>
                                    </div>
                                  )}
                                  {profileData.nextLocation && (
                                    <div className="flex items-center gap-3 text-sm">
                                      <MapPin className="h-4 w-4 text-purple-400" />
                                      <span className="text-white/80">Next destination <span className="font-medium text-white">{profileData.nextLocation}</span></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-gray-400">No users found</span>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="relative">
            {/* 2x2 Grid */}
            <div className="pt-6 px-3">
              <div className="grid grid-cols-2 gap-3">
                {(users || []).slice(0, 4).map((user, index) => (
                  <div
                    key={user.id}
                    className="aspect-square"
                    data-testid={`grid-user-card-${user.id}`}
                  >
                    <UserCard
                      user={user}
                      onClick={() => {
                        setCurrentUserIndex(index);
                        setViewMode("single");
                      }}
                      className="h-full"
                      variant="grid"
                    />
                  </div>
                ))}
                {(!users || users.length === 0) && (
                  <div className="col-span-2 text-center py-8">
                    <span className="text-gray-400">No users found</span>
                  </div>
                )}
              </div>
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
