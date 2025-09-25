
import { useState } from "react";
import { useTranslation } from "@/lib/translations";
import { useLocation, Link } from "wouter";
import { Search, ChevronDown, User, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UserCard } from "@/components/ui/user-card";
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

  // Count users for different sections
  const nearbyUsers = users?.filter(user => user.location) || [];
  const commonInterestsUsers = users?.filter(user => 
    user.interests && user.interests.length > 0
  ) || [];

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
      <main className="flex-1 px-5 space-y-6">
        {/* Like-vibe people near you section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-base font-medium">
              Like-vibe people near you
            </h2>
            <span className="text-white text-base font-medium">
              {nearbyUsers.length}
            </span>
          </div>
          
          {/* Map area placeholder */}
          <div className="bg-gray-600 rounded-lg h-32 flex items-center justify-center">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          
          {/* Location indicator */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Q</span>
            <span className="text-gray-400">City Name</span>
          </div>
        </section>

        {/* People near you with common interests section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-base font-medium">
              People near you with common interests
            </h2>
            <span className="text-white text-base font-medium">
              {commonInterestsUsers.length}
            </span>
          </div>
          
          {/* Q and A buttons */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Q</span>
            </div>
          </div>

          {/* User cards list */}
          <div className="space-y-2">
            {isLoading ? (
              // Loading state
              <div className="text-center py-4">
                <span className="text-gray-400">Loading users...</span>
              </div>
            ) : commonInterestsUsers.length > 0 ? (
              commonInterestsUsers.slice(0, 3).map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => handleUserClick(user)}
                  data-testid={`user-card-${user.id}`}
                />
              ))
            ) : (
              <div className="text-center py-4">
                <span className="text-gray-400">No users found</span>
              </div>
            )}
          </div>
        </section>
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
