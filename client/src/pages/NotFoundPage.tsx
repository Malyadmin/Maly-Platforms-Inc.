import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function NotFoundPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="mt-4"
          aria-label="Back to home"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Back to Home</span>
        </Button>
      </div>
    </div>
  );
}
