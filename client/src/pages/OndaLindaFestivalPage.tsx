import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useTranslation } from "@/lib/translations";
import { Clock } from "lucide-react";
import { Timeline } from "@/components/ui/timeline";

interface EventUser {
  id: number;
  name: string;
  image: string;
}

const getFirstName = (fullName: string) => fullName?.split(' ')[0] || '';

export default function OndaLindaFestivalPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Festival schedule data
  const festivalSchedule = [
    {
      time: "4:00 PM",
      artist: "Opening Ceremony",
      stage: "Main Stage",
      description: "Welcome to Onda Linda Festival 2025"
    },
    {
      time: "5:00 PM",
      artist: "DJ Maria Luna",
      stage: "Beach Stage",
      description: "Sunset electronic vibes"
    },
    {
      time: "7:00 PM",
      artist: "The Crystal Collective",
      stage: "Forest Stage",
      description: "Live electronic fusion"
    },
    {
      time: "9:00 PM",
      artist: "Cosmic Brothers",
      stage: "Main Stage",
      description: "Progressive trance journey"
    },
    {
      time: "11:00 PM",
      artist: "Luna Sage",
      stage: "Beach Stage",
      description: "Deep house meditation"
    },
    {
      time: "1:00 AM",
      artist: "Closing Ceremony",
      stage: "All Stages",
      description: "United closing celebration"
    }
  ];

  // Festival data
  const festival = {
    id: 1001,
    title: "Onda Linda Festival",
    description: "Experience the mystical fusion of electronic music and art in an immersive natural setting, featuring world-class DJs and stunning visual installations.",
    date: new Date("2025-05-02T21:00:00"),
    location: "Valle de Bravo",
    category: "Festivals",
    image: "/attached_assets/Screenshot 2025-03-06 at 11.00.33 AM.png",
    capacity: 500,
    price: 85,
    attendingCount: 156,
    interestedCount: 342,
    attendingUsers: [
      { id: 1, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
      { id: 2, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
      { id: 3, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
      { id: 4, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
      { id: 5, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" }
    ],
    interestedUsers: [
      { id: 6, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
      { id: 7, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
      { id: 8, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
      { id: 9, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
      { id: 10, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" }
    ]
  };

  const participateMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/events/${festival.id}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update participation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully updated participation status",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update participation status",
      });
    },
  });

  const handleUserClick = (userId: number) => {
    setLocation(`/profile/${userId}`);
  };

  const handleViewAllUsers = (type: 'attending' | 'interested') => {
    setLocation(`/event/${festival.id}/users?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <BackButton 
            className="text-white hover:bg-foreground/10"
            onClick={() => setLocation("/")}
          />
        </div>
      </header>

      <div className="w-full h-64 md:h-96 relative">
        <img
          src={festival.image}
          alt={festival.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{festival.title}</h1>
          <div className="mt-2 text-white/60">
            <p>{format(festival.date, "EEE, MMM d")}</p>
            <p className="mt-1">
              {format(festival.date, "h:mm a")} -{" "}
              {format(new Date(festival.date.getTime() + 2 * 60 * 60 * 1000), "h:mm a")}
            </p>
            <p className="mt-1">{festival.location}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Festival Schedule</h2>
          </div>
          <Timeline schedule={festivalSchedule} className="mt-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">About this event</h2>
          <p className="text-white/80 whitespace-pre-wrap">
            {festival.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-white/60">Price</p>
              <p className="text-xl font-semibold">${festival.price}</p>
            </div>
            <Button 
              className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 hover:from-teal-700 hover:via-blue-700 hover:to-purple-700 text-white"
              onClick={() => setLocation(`/event/${festival.id}/tickets`)}
            >
              Get Tickets
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60">
              Attending
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3" onClick={() => handleViewAllUsers('attending')} style={{cursor: 'pointer'}}>
                {festival.attendingUsers.map((user) => (
                  <Avatar 
                    key={user.id} 
                    className="ring-2 ring-background w-12 h-12 border-2 border-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user.id);
                    }}
                  >
                    <AvatarImage 
                      src={user.image} 
                      alt={getFirstName(user.name)}
                      className="object-cover"
                    />
                    <AvatarFallback>{getFirstName(user.name)[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="text-sm text-white/60 hover:text-white"
                onClick={() => handleViewAllUsers('attending')}
              >
                +{festival.attendingCount - festival.attendingUsers.length} more
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60">
              Interested
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3" onClick={() => handleViewAllUsers('interested')} style={{cursor: 'pointer'}}>
                {festival.interestedUsers.map((user) => (
                  <Avatar 
                    key={user.id} 
                    className="ring-2 ring-background w-12 h-12 border-2 border-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user.id);
                    }}
                  >
                    <AvatarImage 
                      src={user.image} 
                      alt={getFirstName(user.name)}
                      className="object-cover"
                    />
                    <AvatarFallback>{getFirstName(user.name)[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="text-sm text-white/60 hover:text-white"
                onClick={() => handleViewAllUsers('interested')}
              >
                +{festival.interestedCount - festival.interestedUsers.length} more
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            onClick={() => participateMutation.mutate("attending")}
          >
            I'll be attending
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-gray-600 text-white hover:bg-gray-800"
            onClick={() => participateMutation.mutate("interested")}
          >
            I'm interested
          </Button>
        </div>
      </div>
    </div>
  );
}