import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";

export default function TestCreateEventPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createSimpleEvent = async () => {
    setLoading(true);

    try {
      // Create a simple form data object with minimal required fields
      const formData = new FormData();
      formData.append('title', 'Test Event ' + new Date().toLocaleTimeString());
      formData.append('description', 'This is an automatically generated test event');
      formData.append('location', 'Mexico City');
      formData.append('date', new Date().toISOString());

      // Get the stored session ID
      const sessionId = localStorage.getItem('maly_session_id');

      // Get user data from localStorage for fallback authentication
      const userData = localStorage.getItem('maly_user_data');
      let userId = null;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user.id;
          // Add userId as a fallback authentication method
          formData.append('userId', userId.toString());
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      // Add headers
      const headers: HeadersInit = {};
      if (sessionId) {
        headers['X-Session-ID'] = sessionId;
      }

      // Send the request
      const response = await fetch('/api/events', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Event Created!",
          description: `Your test event "${data.event.title}" was created successfully.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Creation Failed",
          description: data.error || "Failed to create test event"
        });
      }
    } catch (error) {
      console.error("Error creating test event:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "An error occurred creating the test event"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <PageHeader
        title="Test Event Creation"
        backButtonFallbackPath="/"
        className="bg-black/80"
      />

      <div className="container mx-auto px-4 py-8 space-y-8 max-w-2xl">
        <div className="bg-white/5 p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-medium">Authentication Test</h2>
          <p className="text-white/60">
            Click the button below to create a simple test event. This will attempt to use your 
            current authentication status to create an event with minimal information.
          </p>

          <div className="pt-4">
            <Button 
              onClick={createSimpleEvent}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Test Event'}
            </Button>
          </div>

          <div className="bg-black/50 p-4 rounded text-xs mt-6">
            <h3 className="font-medium mb-2">Session Information:</h3>
            <pre className="whitespace-pre-wrap overflow-auto max-h-40">
              Session ID present: {localStorage.getItem('maly_session_id') ? 'Yes' : 'No'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}