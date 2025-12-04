import { Link, useLocation } from "wouter";
import { 
  Globe, 
  Users,
  Plus,
  MessageCircle,
  Bot
} from "lucide-react";
import { useTranslation } from "@/lib/translations";

// Main navigation items - iOS style 5 tabs
export const mainNavItems = [
  { icon: Globe, label: 'explore', href: "/discover" },
  { icon: Users, label: 'connect', href: "/connect" },
  { icon: Plus, label: 'create', href: "/create" },
  { icon: MessageCircle, label: 'chats', href: "/inbox" },
  { icon: Bot, label: 'concierge', href: "/companion" }
] as const;

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile Bottom Navigation - iOS Style - Theme aware */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-20 px-2">
          {mainNavItems.map(({ icon: Icon, label, href }) => {
            const isActive = location === href;
            
            return (
              <Link 
                key={href} 
                href={href}
                className="relative flex flex-col items-center justify-center gap-1 py-2"
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label === 'concierge' ? 'CONCIERGE' : t(label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation - Theme aware */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-[100] w-16 bg-background border-r border-border shadow-lg flex-col items-center py-8">
        {mainNavItems.map(({ icon: Icon, label, href }) => {
          const isActive = location === href;
          return (
            <Link 
              key={href} 
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-lg transition-all duration-300 ease-out mb-4 group ${
                isActive 
                  ? "text-foreground scale-105" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-6 h-6 transition-transform" />
              <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded whitespace-nowrap border border-border transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                {label === 'concierge' ? 'CONCIERGE' : t(label)}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}