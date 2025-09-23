import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft, Check, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface User {
  id: number;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  image?: string;
  price?: number;
}

export default function SelectPeopleToInvitePage() {
  const { eventId } = useParams();
  const [, setLocation] = useLocation();
  const [searchText, setSearchText] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);

  // Fetch event data
  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    queryFn: async () => {
      // Mock event data - replace with actual API
      return {
        id: parseInt(eventId || '1'),
        title: "Wellness & Movement Session",
        description: "Join us for a mindful movement session combining yoga, meditation, and breathwork in the heart of the city.",
        location: "Central Park, NYC",
        date: "2025-01-15T18:00:00Z",
        image: "/api/placeholder/400/200",
        price: 0
      };
    },
  });

  // Mock data for people - replace with actual API call
  const { data: people = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/connections', searchText],
    queryFn: async () => {
      // Mock people data - replace with actual API
      return [
        { id: 1, name: "Alex Chen", username: "alexc", image: "", bio: "Yoga enthusiast" },
        { id: 2, name: "Maria Rodriguez", username: "maria_r", image: "", bio: "Mindfulness coach" },
        { id: 3, name: "James Wilson", username: "jwilson", image: "", bio: "Wellness advocate" },
        { id: 4, name: "Sophia Kim", username: "sophiak", image: "", bio: "Movement therapist" },
        { id: 5, name: "David Thompson", username: "dthompson", image: "", bio: "Meditation teacher" },
      ];
    },
  });

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchText.toLowerCase()) ||
    person.username?.toLowerCase().includes(searchText.toLowerCase())
  );

  const togglePersonSelection = (personId: number) => {
    setSelectedPeople(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleInvite = () => {
    console.log("Inviting people:", selectedPeople);
    // Implement invite functionality
    setLocation(`/event/${eventId}`);
  };

  if (eventLoading || !event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* iOS-style Header */}
      <div className="bg-black text-white sticky top-0 z-50 border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 pt-12">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/event/${eventId}`)}
            className="text-white p-0 h-auto font-normal"
          >
            Cancel
          </Button>
          <h1 className="text-white text-lg font-semibold">Invite People</h1>
          <Button 
            variant="ghost" 
            onClick={handleInvite}
            disabled={selectedPeople.length === 0}
            className={`p-0 h-auto font-normal ${
              selectedPeople.length > 0 ? 'text-yellow-400' : 'text-gray-500'
            }`}
          >
            Invite
          </Button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Event Preview Card */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="flex gap-4">
            {event.image && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg mb-2 truncate">{event.title}</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs">
                  {event.price === 0 ? 'Free Event' : `$${event.price}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Select people to invite</h2>
          <p className="text-white/70 text-base">
            Choose from your connections who might be interested
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            type="text"
            placeholder="Search by name"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 bg-transparent border-0 border-b border-white/30 rounded-none text-white placeholder-white/40 focus:border-white/60 focus-visible:ring-0"
            data-testid="input-search-people"
          />
        </div>

        {/* People List */}
        <div className="space-y-0">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            ))
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No people found</p>
            </div>
          ) : (
            filteredPeople.map((person) => (
              <div 
                key={person.id} 
                className="flex items-center justify-between py-4 border-b border-white/10 cursor-pointer"
                onClick={() => togglePersonSelection(person.id)}
                data-testid={`person-item-${person.id}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={person.image} alt={person.name} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white font-medium">{person.name}</h3>
                    <p className="text-white/60 text-sm">@{person.username}</p>
                    {person.bio && (
                      <p className="text-white/50 text-xs mt-1">{person.bio}</p>
                    )}
                  </div>
                </div>
                
                {/* Selection Indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedPeople.includes(person.id)
                    ? 'bg-yellow-400 border-yellow-400'
                    : 'border-white/40'
                }`}>
                  {selectedPeople.includes(person.id) && (
                    <Check className="w-4 h-4 text-black" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Count */}
        {selectedPeople.length > 0 && (
          <div className="fixed bottom-24 left-0 right-0 px-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
              <p className="text-white">
                {selectedPeople.length} person{selectedPeople.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}