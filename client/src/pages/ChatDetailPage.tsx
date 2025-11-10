import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

export default function ChatDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");

  // Mock data - in a real app, this would come from an API
  const chat = {
    user: {
      id: 1,
      name: "John Doe",
      image: "/attached_assets/profile-image-1.jpg",
    },
    messages: [
      {
        id: 1,
        content: "Hey! How are you?",
        sender: "user",
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        content: "I'm good, thanks! How about you?",
        sender: "self",
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const handleSend = () => {
    if (!message.trim()) return;
    // In a real app, this would send the message to an API
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => setLocation("/chat")} />
            <Avatar className="h-8 w-8">
              <AvatarImage src={chat.user.image} alt={chat.user.name} />
              <AvatarFallback>{chat.user.name[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{chat.user.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "self" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender === "self"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-background border-t p-4">
        <div className="container mx-auto flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <Button size="icon" onClick={handleSend}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
