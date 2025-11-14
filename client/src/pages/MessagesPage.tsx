import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/ui/page-header";

// Mock data moved to a separate constant
const mockConversations = [
  {
    user: {
      id: 1,
      name: "Carlita",
      image: "/attached_assets/Screenshot 2025-03-06 at 11.38.31 AM.png",
      status: "Online",
      mood: "Creative",
      location: "Istanbul"
    },
    lastMessage: {
      content: "Would love to collaborate on your next music project!",
      createdAt: new Date().toISOString()
    }
  },
  {
    user: {
      id: 2,
      name: "Alex",
      image: "/attached_assets/profile-image-2.jpg",
      status: "Away",
      mood: "Adventurous",
      location: "Mexico City"
    },
    lastMessage: {
      content: "Here's a shot from my latest adventure",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  }
];

const ConversationCard = ({ conversation, onClick }: { 
  conversation: typeof mockConversations[0];
  onClick: () => void;
}) => (
  <Card
    className="hover:bg-foreground/10/5 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div className="p-4 flex items-center gap-4">
      <Avatar className="h-12 w-12 ring-2 ring-primary/10">
        <AvatarImage src={conversation.user.image} alt={conversation.user.name} />
        <AvatarFallback>{conversation.user.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{conversation.user.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              conversation.user.mood === "Creative" 
                ? "bg-pink-500/20 text-pink-500" 
                : "bg-blue-500/20 text-blue-500"
            }`}>
              {conversation.user.mood}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm truncate text-muted-foreground">
            {conversation.lastMessage.content}
          </p>
          <span className="text-xs text-muted-foreground">• {conversation.user.location}</span>
        </div>
      </div>
    </div>
  </Card>
);

export default function MessagesPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = mockConversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Messages"
        backButtonFallbackPath="/"
        className="bg-black/40"
      />

      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-sm border-b border-accent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages"
              className="pl-9 bg-accent/50"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-2">
          {filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.user.id}
              conversation={conv}
              onClick={() => setLocation(`/chat/${conv.user.id}`)}
            />
          ))}
          {filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">No messages found</p>
              <Button className="mt-4" onClick={() => setLocation("/")}>
                Browse Members
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}