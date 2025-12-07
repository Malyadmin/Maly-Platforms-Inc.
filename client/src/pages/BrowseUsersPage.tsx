import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATOR_PROFILE } from "@/lib/constants";

interface User {
  id: number;
  username: string;
  fullName?: string | null;
  gender?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  profileImages?: string[];
  location?: string | null;
  birthLocation?: string | null;
  nextLocation?: string | null;
  interests?: string[];
  currentMoods?: string[];
  profession?: string | null;
  age?: number | null;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

// Loading card animation
const loadingPulse = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: 1,
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

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

const moods = [
  "Party",
  "Socializing",
  "Dating",
  "Networking",
  "Exploring",
  "Chilling",
  "Adventure",
  "Cultural",
  "Learning",
  "Working"
];

export default function BrowseUsersPage() {
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState({ min: "", max: "" });
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [nameSearch, setNameSearch] = useState(""); 

  const { data: browseResponse, isLoading } = useQuery<{ users: User[], pagination: { limit: number, offset: number, total: number, hasMore: boolean } }>({
    queryKey: ['/api/users/browse', selectedCity, selectedGender, selectedInterests, selectedMoods, ageRange, nameSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCity !== 'all') params.append('location', selectedCity);
      if (selectedGender !== 'all') params.append('gender', selectedGender);
      if (ageRange.min) params.append('minAge', ageRange.min);
      if (ageRange.max) params.append('maxAge', ageRange.max);
      if (selectedInterests.length > 0) {
        selectedInterests.forEach(interest => 
          params.append('interests', interest)
        );
      }
      if (selectedMoods.length > 0) {
        selectedMoods.forEach(mood => 
          params.append('moods', mood)
        );
      }
      if (nameSearch) params.append('name', nameSearch);
      
      // Add limit and offset as in iOS app
      params.append('limit', '20');
      params.append('offset', '0'); 

      const response = await fetch(`/api/users/browse?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      console.log('Received data from /api/users/browse:', data);
      return data;
    },
  });

  const apiUsers = browseResponse?.users || [];

  const users = (() => {
    const allUsers = [...(apiUsers || [])];

    // Always add the creator profile if not present
    if (!allUsers.find(u => u.username === CREATOR_PROFILE.username)) {
      allUsers.push(CREATOR_PROFILE as User);
    }

    // Sort to ensure creator profile appears first
    const sortedUsers = allUsers.sort((a, b) => {
      // Creator profile always comes first
      if (a.username === CREATOR_PROFILE.username) return -1;
      if (b.username === CREATOR_PROFILE.username) return 1;
      // For other users, maintain their original order
      return 0;
    });

    return sortedUsers.filter(user => {
      const matchesName = nameSearch
        ? (user.fullName?.toLowerCase().includes(nameSearch.toLowerCase()) ||
           user.username.toLowerCase().includes(nameSearch.toLowerCase()))
        : true;

      const matchesCity = selectedCity === 'all' || user.location === selectedCity;
      const matchesInterests = selectedInterests.length === 0 || 
        selectedInterests.every(interest => user.interests?.includes(interest));
      const matchesMoods = selectedMoods.length === 0 ||
        selectedMoods.every(mood => user.currentMoods?.includes(mood));

      return matchesName && matchesCity && matchesInterests && matchesMoods;
    });
  })();

  const handleUserClick = (username: string) => {
    setLocation(`/profile/${username}`);
  };

  const toggleFilter = (item: string, filterType: 'interests' | 'moods') => {
    const setterFn = filterType === 'interests' ? setSelectedInterests : setSelectedMoods;
    setterFn(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-sm supports-[backdrop-filter]:bg-[#121212]/60 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-accent-maly">Connect in {selectedCity === 'all' ? 'All Cities' : selectedCity}</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className="gap-2 text-white/80 hover:text-white interactive-hover"
                aria-expanded={isFiltersVisible}
                aria-label="Toggle filters"
              >
                <Search className="w-4 h-4" />
                Filters
              </Button>
              <Select 
                value={selectedCity} 
                onValueChange={setSelectedCity}
                aria-label="Select city"
              >
                <SelectTrigger className="w-[180px] bg-[#1a1a1a] border-white/10 text-white focus-visible">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="all" className="text-white">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city} className="text-white">{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence>
          {isFiltersVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#1a1a1a] p-6 rounded-lg border border-white/10 glass">
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Search</h3>
                  <Input
                    placeholder="Search by name..."
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                    className="bg-[#242424] border-white/10 text-white placeholder:text-white/60"
                    aria-label="Search users by name"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Demographics</h3>
                  <div className="space-y-4">
                    <Select value={selectedGender} onValueChange={setSelectedGender} aria-label="Select gender">
                      <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10">
                        <SelectItem value="all" className="text-white">All Genders</SelectItem>
                        <SelectItem value="male" className="text-white">Male</SelectItem>
                        <SelectItem value="female" className="text-white">Female</SelectItem>
                        <SelectItem value="other" className="text-white">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min age"
                        value={ageRange.min}
                        onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
                        className="bg-[#242424] border-white/10 text-white placeholder:text-white/60"
                        aria-label="Minimum age"
                      />
                      <Input
                        type="number"
                        placeholder="Max age"
                        value={ageRange.max}
                        onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
                        className="bg-[#242424] border-white/10 text-white placeholder:text-white/60"
                        aria-label="Maximum age"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {interests.map(interest => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80 transition-opacity text-white"
                        onClick={() => toggleFilter(interest, 'interests')}
                        aria-pressed={selectedInterests.includes(interest)}
                        aria-label={`Select/deselect ${interest} interest`}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Current Mood</h3>
                  <div className="flex flex-wrap gap-2">
                    {moods.map(mood => (
                      <Badge
                        key={mood}
                        variant={selectedMoods.includes(mood) ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80 transition-opacity text-white"
                        onClick={() => toggleFilter(mood, 'moods')}
                        aria-pressed={selectedMoods.includes(mood)}
                        aria-label={`Select/deselect ${mood} mood`}
                      >
                        {mood}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="show"
            variants={container}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div 
                key={i} 
                variants={loadingPulse}
                className="aspect-[3/4] bg-[#1a1a1a] rounded-lg glass"
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {users?.map((user) => (
              <motion.div
                key={user.id}
                variants={item}
                layout
                className="group cursor-pointer"
                onClick={() => handleUserClick(user.username)}
                role="button"
                tabIndex={0}
                aria-label={`View ${user.fullName || user.username}'s profile`}
                onKeyDown={(e) => e.key === 'Enter' && handleUserClick(user.username)}
              >
                <Card className="overflow-hidden border-0 bg-[#1a1a1a] shadow-card transition-all duration-300 group-hover:shadow-card-hover glass">
                  <CardContent className="p-0">
                    <div className="aspect-[3/4] relative">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullName || user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#242424] flex items-center justify-center">
                          <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {(user.fullName?.[0] || user.username[0]).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">{user.fullName || user.username}</h3>
                            {user.age && (
                              <span className="text-sm flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {user.age}
                              </span>
                            )}
                          </div>
                          {user.location && (
                            <div className="flex items-center gap-2 text-sm text-white/80">
                              <MapPin className="w-3 h-3" />
                              {user.location}
                            </div>
                          )}
                          {user.interests && user.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.interests.slice(0, 2).map(interest => (
                                <span 
                                  key={interest} 
                                  className="text-xs bg-white/20 px-2 py-0.5 rounded-full"
                                >
                                  {interest}
                                </span>
                              ))}
                              {user.interests.length > 2 && (
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                  +{user.interests.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}