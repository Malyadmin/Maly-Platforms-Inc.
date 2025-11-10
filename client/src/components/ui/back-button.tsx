import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  fallbackPath?: string;
  forceUsePathFallback?: boolean;
  onClick?: () => void;
}

export function BackButton({ 
  className = "", 
  variant = "ghost", 
  fallbackPath = "/discover",
  forceUsePathFallback = false,
  onClick
}: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (forceUsePathFallback) {
      setLocation(fallbackPath);
      return;
    }
    
    if (window.history.length <= 1) {
      setLocation(fallbackPath);
    } else {
      window.history.back();
    }
  };

  return (
    <Button
      variant={variant}
      size="icon"
      className={`text-white hover:bg-white/10 ${className}`}
      onClick={handleBack}
      aria-label="Go back"
    >
      <ChevronLeft className="h-5 w-5" />
      <span className="sr-only">Back</span>
    </Button>
  );
}