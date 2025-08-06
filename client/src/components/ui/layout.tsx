import { BottomNav } from "./bottom-nav";
import { Logo } from "./logo";
import { Menu, Bot, Globe, Inbox, Crown, Settings, UserCircle, LogOut } from "lucide-react";
import { Button } from "./button";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useTranslation } from "@/lib/translations";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom styled inbox icon with gradient
const GradientInboxIcon = () => {
  return (
    <div className="relative">
      <svg 
        width="33" 
        height="33" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="url(#inbox-gradient)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="lucide lucide-inbox"
      >
        <defs>
          <linearGradient id="inbox-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout, isLoading, refetchUser, refreshUser } = useUser();
  const { t } = useTranslation();
  const [authChecked, setAuthChecked] = useState(false);
  const [userDisplayData, setUserDisplayData] = useState<any>(null);

  // Ensure we have user data to display even if the main auth state is slow to update
  useEffect(() => {
    // Set user display data from the user object when available
    if (user) {
      console.log("User data available for display:", user.username);
      setUserDisplayData(user);
    } else {
      // If no user in state, check localStorage for cached user data as a fallback
      try {
        const cachedUserJson = localStorage.getItem('maly_user_data');
        if (cachedUserJson) {
          const cachedUser = JSON.parse(cachedUserJson);
          console.log("Using cached user data for display:", cachedUser.username);
          setUserDisplayData(cachedUser);
        }
      } catch (error) {
        console.error("Error parsing cached user data for display:", error);
      }
    }
  }, [user]);

  // Monitor authentication state and redirect if needed
  useEffect(() => {
    const checkAuthState = async () => {
      // Don't redirect if we're already on the auth page
      if (location === '/auth') {
        setAuthChecked(true);
        return;
      }
      
      // Only refresh user data when necessary (not authenticated and not already checking)
      if (!user && !isLoading && !authChecked) {
        console.log("Auth check needed - getting user data");
        // Using refetchUser instead of refreshUser for a less intensive check
        await refetchUser();
      }
      
      // If we've checked auth and user is still null (and not loading), redirect to auth page
      if (!isLoading && !user && !authChecked) {
        console.log("No authenticated user detected, redirecting to auth page");
        setLocation('/auth');
      }
      
      // Mark that we've checked authentication
      setAuthChecked(true);
    };
    
    checkAuthState();
    
    // Remove refreshUser from dependencies to prevent unnecessary reruns
  }, [user, isLoading, location, setLocation, refetchUser, authChecked]);

  const handleLogout = async () => {
    // Just call logout - the useUser hook will handle the redirection
    await logout();
    // No need to call setLocation as the logout function will force a redirect to /auth
  };

  const menuItems = [
    { href: "/premium", label: "premiumUpgrade", icon: Crown, isPremium: true },
    { href: "/inbox", label: "inbox", icon: Inbox },
    { href: "/translator", label: "translator", icon: Globe },
    { href: "/companion", label: "concierge", icon: Bot },
    { href: "/profile", label: "profile", icon: UserCircle },
    { href: "/admin", label: "adminPanel", icon: Settings, isAdmin: true },
    { onClick: handleLogout, label: "logout", icon: LogOut }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-50 bg-black text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <a className="flex items-center space-x-2" href="/">
                <Logo className="h-8 w-auto" />
              </a>
            </div>
            <div className="flex items-center gap-4">
              {/* Mobile Inbox Icon */}
              {(userDisplayData || user) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden interactive-hover p-2"
                  onClick={() => setLocation("/inbox")}
                >
                  <GradientInboxIcon />
                  <span className="sr-only">Inbox</span>
                </Button>
              )}
              
              {/* User profile or avatar - only show when authenticated */}
              {(userDisplayData || user) && (
                <Button 
                  variant="ghost"
                  size="sm" 
                  className="interactive-hover hidden md:flex items-center gap-2"
                  onClick={() => setLocation("/profile")}
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden">
                    {(userDisplayData || user)?.profileImage ? (
                      <img 
                        src={(userDisplayData || user)?.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <UserCircle className="w-6 h-6" />
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">
                    {(userDisplayData || user)?.fullName || (userDisplayData || user)?.username || "My Profile"}
                  </span>
                </Button>
              )}
              
              {/* Hamburger Menu - only show on desktop */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="interactive-hover">
                      <Menu className="w-6 h-6" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {menuItems.map((item, index) => 
                      // Only show admin links for admins
                      (!item.isAdmin || (user && user.isAdmin)) && (
                        <DropdownMenuItem 
                          key={index}
                          className={`cursor-pointer interactive-hover ${item.isPremium ? 'text-purple-500 font-medium' : ''} ${item.isAdmin ? 'text-red-500 font-medium' : ''}`}
                          onClick={() => item.onClick ? item.onClick() : setLocation(item.href)}
                        >
                          <item.icon className="w-4 h-4 mr-2" />
                          <span>{t(item.label)}</span>
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-1 ${!location.startsWith('/event/') && !location.startsWith('/edit-event/') ? 'pb-24' : 'pb-0'} md:pb-6`}>
        {children}
      </main>

      {/* Hide bottom navigation on event pages and edit event pages */}
      {!location.startsWith('/event/') && !location.startsWith('/edit-event/') && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      )}
    </div>
  );
}