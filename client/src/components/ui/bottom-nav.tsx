import { Link, useLocation } from "wouter";
import { 
  Globe, 
  Users,
  Plus,
  MessageCircle,
  UserCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/translations";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

// Main navigation items - iOS style 5 tabs
export const mainNavItems = [
  { icon: Globe, label: 'discover', href: "/discover" },
  { icon: Users, label: 'connect', href: "/connect" },
  { icon: Plus, label: 'create', href: "/create" },
  { icon: MessageCircle, label: 'inbox', href: "/inbox" },
  { icon: UserCircle, label: 'profile', href: "/profile" }
] as const;

// No more menu items needed since inbox and profile are in main nav

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useUser();

  return (
    <>
      {/* Mobile Bottom Navigation - iOS Style - Always black */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black border-t border-gray-800 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-20 px-2">
          {mainNavItems.map(({ icon: Icon, label, href }) => {
            const isActive = location === href;
            
            return (
              <Link 
                key={href} 
                href={href}
                className="relative flex flex-col items-center justify-center gap-1 py-2"
              >
                {label === 'profile' && user ? (
                  <Avatar className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    <AvatarImage src={user.profileImage || ''} alt={user.fullName || user.username} />
                    <AvatarFallback className="text-xs bg-gray-700 text-white">
                      {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                )}
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {t(label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation - Always black */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-[100] w-16 bg-black border-r border-gray-800 shadow-lg flex-col items-center py-8">
        {mainNavItems.map(({ icon: Icon, label, href }) => {
          const isActive = location === href;
          return (
            <Link 
              key={href} 
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-lg transition-all duration-300 ease-out mb-4 group ${
                isActive 
                  ? "text-white scale-105" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {label === 'profile' && user ? (
                <Avatar className={`w-6 h-6 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  <AvatarImage src={user.profileImage || ''} alt={user.fullName || user.username} />
                  <AvatarFallback className="text-xs bg-gray-700 text-white">
                    {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon className="w-6 h-6 transition-transform" />
              )}
              <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 absolute left-16 bg-black text-white px-2 py-1 rounded whitespace-nowrap border border-gray-700 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                {t(label)}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}