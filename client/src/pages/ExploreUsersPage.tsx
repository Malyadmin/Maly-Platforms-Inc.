import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search } from "lucide-react";

export default function ExploreUsersPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - in a real app, this would come from an API
  const users = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    location: "New York",
    bio: "Digital nomad exploring the world...",
    interests: ["Travel", "Photography", "Tech"],
    image: `/attached_assets/profile-image-${(i % 9) + 1}.jpg`,
  }));

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="overflow-hidden hover:bg-foreground/10/5 cursor-pointer"
              onClick={() => setLocation(`/profile/${user.username}`)}
            >
              <div className="aspect-square relative">
                <img
                  src={user.image}
                  alt={user.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{user.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {user.location}
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {user.bio}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.interests.map((interest, idx) => (
                    <Badge key={idx} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
