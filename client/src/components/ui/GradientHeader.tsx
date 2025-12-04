import React from "react";
import { useLocation } from "wouter";
import { BackButton } from '@/components/ui/back-button';
import { 
  MapPin, 
  UserCircle, 
  PlusCircle, 
  Globe, 
  Inbox as InboxIcon,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

// Define mapping for page titles to icons
const iconMap = {
  discover: MapPin,
  connect: UserCircle,
  create: PlusCircle,
  edit: PlusCircle,
  concierge: Globe,
  inbox: InboxIcon,
};

interface GradientHeaderProps {
  title: keyof typeof iconMap | string;
  children?: React.ReactNode;
  showBackButton?: boolean;
  backButtonFallbackPath?: string;
  forceUsePathFallback?: boolean;
  className?: string;
  showIcon?: boolean;
  showThemeToggle?: boolean;
}

export function GradientHeader({ 
  title, 
  children,
  showBackButton = true,
  backButtonFallbackPath = "/discover",
  forceUsePathFallback = false,
  className = "",
  showIcon = true,
  showThemeToggle = true
}: GradientHeaderProps) {
  const { theme, setTheme } = useTheme();
  
  // Get the appropriate icon based on title, defaulting to discover icon
  let Icon = iconMap.discover;
  
  // Try to match the title to a known icon, handling both translated and original titles
  const lowerCaseTitle = title.toLowerCase();
  Object.keys(iconMap).forEach(key => {
    if (lowerCaseTitle.includes(key)) {
      Icon = iconMap[key as keyof typeof iconMap];
    }
  });
  const [location] = useLocation();
  
  // Auto-detect if we're on profile page to force fallback
  const isProfilePage = location.startsWith('/profile/');
  const shouldForcePathFallback = forceUsePathFallback || isProfilePage;
  
  // Determine current effective theme
  const effectiveTheme = theme === "system" 
    ? (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  
  const toggleTheme = () => {
    setTheme(effectiveTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className={`sticky top-0 z-10 bg-background border-b border-border ${className}`}>
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4 overflow-visible w-full">
          {showBackButton && (
            <BackButton 
              fallbackPath={backButtonFallbackPath} 
              forceUsePathFallback={shouldForcePathFallback} 
            />
          )}
          <div className="flex items-center gap-2">
            {showIcon && <Icon className="w-5 h-5 text-primary" aria-hidden="true" />}
            <h1 className="text-lg font-medium uppercase bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent" style={{ letterSpacing: '0.3em' }}>
              {typeof title === 'string' ? title.toUpperCase().split('').join(' ') : title}
            </h1>
          </div>
          <div className="ml-auto flex items-center flex-shrink-0 gap-2">
            {showThemeToggle && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-foreground/10 transition-colors"
                aria-label="Toggle theme"
              >
                {effectiveTheme === "dark" ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )}
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </header>
  );
}