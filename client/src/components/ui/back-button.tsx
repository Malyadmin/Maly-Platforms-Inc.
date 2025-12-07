import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

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
      className={`group relative overflow-hidden transition-all duration-200 active:scale-95 hover:shadow-lg before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/30 before:via-primary/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity ${className}`}
      onClick={handleBack}
      aria-label="Go back"
      data-testid="button-back"
    >
      <span aria-hidden="true" className="text-lg leading-none tracking-tight relative z-10">{"<"}</span>
      <span className="sr-only">Back</span>
    </Button>
  );
}