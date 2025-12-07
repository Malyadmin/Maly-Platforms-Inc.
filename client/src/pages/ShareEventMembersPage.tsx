import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: number;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
}

export default function ShareEventMembersPage() {
  const [, setLocation] = useLocation();
  const [searchText, setSearchText] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // Mock data for members - replace with actual API call
  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/search', searchText],
    queryFn: async () => {
      // Mock members data - replace with actual API
      return [
        { id: 1, name: "Alex Chen", username: "alexc", image: "", bio: "Creative designer" },
        { id: 2, name: "Maria Rodriguez", username: "maria_r", image: "", bio: "Tech enthusiast" },
        { id: 3, name: "James Wilson", username: "jwilson", image: "", bio: "Digital nomad" },
        { id: 4, name: "Sophia Kim", username: "sophiak", image: "", bio: "Startup founder" },
        { id: 5, name: "David Thompson", username: "dthompson", image: "", bio: "Content creator" },
      ];
    },
  });

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchText.toLowerCase()) ||
    member.username?.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleShare = () => {
    console.log("Sharing with members:", selectedMembers);
    // Implement share functionality
    setLocation('/discover');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* iOS-style Header */}
      <div className="bg-black text-white sticky top-0 z-50 border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 pt-12">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/discover')}
            className="text-white p-0 h-auto font-normal"
          >
            Cancel
          </Button>
          <h1 className="text-white text-lg font-semibold">Share Event</h1>
          <Button 
            variant="ghost" 
            onClick={handleShare}
            disabled={selectedMembers.length === 0}
            className={`p-0 h-auto font-normal ${
              selectedMembers.length > 0 ? 'text-yellow-400' : 'text-gray-500'
            }`}
          >
            Share
          </Button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Share with members</h2>
          <p className="text-white/70 text-base">
            Select members to share this amazing event with
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
            data-testid="input-search-members"
          />
        </div>

        {/* Members List */}
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
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No members found</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between py-4 border-b border-white/10 cursor-pointer"
                onClick={() => toggleMemberSelection(member.id)}
                data-testid={`member-item-${member.id}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white font-medium">{member.name}</h3>
                    <p className="text-white/60 text-sm">@{member.username}</p>
                    {member.bio && (
                      <p className="text-white/50 text-xs mt-1">{member.bio}</p>
                    )}
                  </div>
                </div>
                
                {/* Selection Indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMembers.includes(member.id)
                    ? 'bg-yellow-400 border-yellow-400'
                    : 'border-white/40'
                }`}>
                  {selectedMembers.includes(member.id) && (
                    <Check className="w-4 h-4 text-black" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Count */}
        {selectedMembers.length > 0 && (
          <div className="fixed bottom-24 left-0 right-0 px-6">
            <div className="bg-accent backdrop-blur-sm rounded-lg px-4 py-3 text-center">
              <p className="text-white">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
        )}

        {/* Send Invitation Button */}
        <div className="mt-8">
          <Button
            onClick={() => console.log("Send invitation to join Maly")}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-medium py-3 rounded-lg"
            data-testid="button-send-invitation"
          >
            Send invitation to join Maly
          </Button>
        </div>
      </div>
    </div>
  );
}