import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, MessageSquare, Star, Shield, Gift, Zap, Smile } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface PremiumDialogProps {
  children?: React.ReactNode;
  userId?: number;
  mood?: string;
  interests?: string[];
  name?: string;
  status?: string;
  image?: string;
}

const getMoodColor = (mood: string) => {
  switch (mood) {
    case 'Creative': return 'from-gray-600 to-gray-500';
    case 'Adventurous': return 'from-blue-600 to-green-600';
    case 'Relaxed': return 'from-green-600 to-teal-600';
    case 'Energetic': return 'from-orange-600 to-red-600';
    case 'Social': return 'from-yellow-600 to-orange-600';
    case 'Focused': return 'from-gray-600 to-gray-500';
    default: return 'from-gray-600 to-gray-800';
  }
};

export function PremiumDialog({ children, userId, mood, interests, name, status, image }: PremiumDialogProps) {
  const [, setLocation] = useLocation();

  const handleMessageClick = () => {
    if (userId) {
      setLocation(`/chat/${userId}`);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline"
        className="bg-gray-900 hover:bg-gray-800 text-foreground border-0"
      >
        <Crown className="w-4 h-4 mr-2" />
        Premium
      </Button>
      <Button
        variant="outline"
        onClick={handleMessageClick}
        className="bg-white hover:bg-gray-100 text-black text-foreground border-0"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Message
      </Button>
    </div>
  );
}