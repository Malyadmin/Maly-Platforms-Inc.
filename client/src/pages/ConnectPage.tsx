
import { useState } from "react";
import { useTranslation } from "@/lib/translations";
import { useLocation, Link } from "wouter";
import { Search, ChevronDown, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UserCard } from "@/components/ui/user-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useUser } from "@/hooks/use-user";

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
  const { t } = useTranslation();

  // Fetch real users from the API
  const { user: currentUser } = useUser();
  const {
    data: users,
    isLoading,
    error
  } = useQuery<ConnectUser[]>({
    queryKey: ['users', selectedCity, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (selectedCity !== 'all') {
        params.append('location', selectedCity);
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

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header Section */}
      <header className="px-5 pt-3 pb-4 bg-black">
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

          {/* Center: MALY title */}
          <h1 className="text-lg font-bold tracking-wider text-white">
            MALY
          </h1>

          {/* Right: Search icon */}
          <button 
            className="p-1"
            onClick={() => setShowSearch(!showSearch)}
            data-testid="search-button"
          >
            <Search className="h-6 w-6 text-white" />
          </button>
        </div>
      </header>

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

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default ConnectPage;
