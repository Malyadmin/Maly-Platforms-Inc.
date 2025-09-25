
import { useState } from "react";
import { useTranslation } from "@/lib/translations";
import { useLocation, Link } from "wouter";
import { Search, ChevronDown, User, Filter, X, Grid3X3, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UserCard } from "@/components/ui/user-card";
import { LargeProfileView } from "@/components/ui/large-profile-view";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIGITAL_NOMAD_CITIES } from "@/lib/constants";

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

export function ConnectPage() {
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [tempSelectedCity, setTempSelectedCity] = useState<string>("all");
  const [tempSelectedGender, setTempSelectedGender] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const { t } = useTranslation();

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

  const handleUserClick = (user: ConnectUser) => {
    setLocation(`/profile/${user.username}`);
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

  // Get current user for single view
  const getCurrentUser = () => {
    if (users && users.length > 0) {
      return users[currentUserIndex];
    }
    return null;
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
            {/* Left: City name with dropdown */}
            <button 
              className="flex items-center gap-1 text-white"
              onClick={() => {/* TODO: Implement city selector */}}
              data-testid="city-selector"
            >
              <span className="text-base font-medium">City name</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Right: Filter and Search icons */}
            <div className="flex items-center gap-2">
              <button 
                className="p-1"
                onClick={() => setShowFiltersModal(true)}
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
      <main className="flex-1 px-5">
        {isLoading ? (
          <div className="text-center py-8">
            <span className="text-gray-400">Loading users...</span>
          </div>
        ) : viewMode === "single" ? (
          /* Single User View */
          <div className="relative">
            {getCurrentUser() ? (
              <div className="relative">
                {/* Grid toggle button */}
                <button
                  onClick={() => setViewMode("grid")}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                  data-testid="grid-view-toggle"
                >
                  <Grid3X3 className="h-5 w-5 text-white" />
                </button>

                {/* Navigation arrows */}
                {users && users.length > 1 && (
                  <>
                    <button
                      onClick={prevUser}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                      data-testid="prev-user-button"
                    >
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                    <button
                      onClick={nextUser}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                      data-testid="next-user-button"
                    >
                      <ChevronRight className="h-6 w-6 text-white" />
                    </button>
                  </>
                )}

                {/* Large Profile View */}
                <div className="pt-6">
                  <LargeProfileView
                    user={getCurrentUser()!}
                    onConnect={() => {
                      // TODO: Implement connect functionality
                      console.log("Connect clicked for user:", getCurrentUser()!.username);
                    }}
                    data-testid={`large-profile-view-${getCurrentUser()!.id}`}
                  />
                </div>

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
            ) : (
              <div className="text-center py-8">
                <span className="text-gray-400">No users found</span>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="relative">
            {/* Single view toggle button */}
            <button
              onClick={() => setViewMode("single")}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
              data-testid="single-view-toggle"
            >
              <User className="h-5 w-5 text-white" />
            </button>

            {/* 4x4 Grid */}
            <div className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                {(users || []).slice(0, 16).map((user) => (
                  <div
                    key={user.id}
                    className="h-80"
                    data-testid={`grid-profile-view-${user.id}`}
                  >
                    <LargeProfileView
                      user={user}
                      onConnect={() => {
                        // TODO: Implement connect functionality
                        console.log("Connect clicked for user:", user.username);
                      }}
                      className="h-full"
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

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default ConnectPage;
