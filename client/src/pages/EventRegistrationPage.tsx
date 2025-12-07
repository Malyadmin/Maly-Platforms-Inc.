import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function EventRegistrationPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [ticketCount, setTicketCount] = useState(1);

  const handleRegistration = async () => {
    try {
      // In a real app, this would make an API call
      toast({
        title: "Success",
        description: "Registration successful!",
      });
      setLocation(`/event/${id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to register for the event",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <BackButton onClick={() => setLocation(`/event/${id}`)} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Event Registration</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Tickets
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={ticketCount}
              onChange={(e) => setTicketCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleRegistration}
          >
            Complete Registration
          </Button>
        </div>
      </main>
    </div>
  );
}
