import { Link, useLocation } from "wouter";
import { 
  Globe, 
  Users,
  Plus,
  MessageCircle
} from "lucide-react";
import { useTranslation } from "@/lib/translations";

export const mainNavItems = [
  { icon: Globe, label: 'explore', displayLabel: 'EVENTS', href: "/discover" },
  { icon: Users, label: 'connect', displayLabel: 'PEOPLE', href: "/connect" },
  { icon: Plus, label: 'create', displayLabel: 'CREATE', href: "/create" },
  { icon: MessageCircle, label: 'chats', displayLabel: 'CHATS', href: "/inbox" },
  { icon: null, image: "https://res.cloudinary.com/dwmolc54p/image/upload/v1765146570/avatars/maly_ai_agent_avatar.jpg", label: 'concierge', displayLabel: 'CONCIERGE', href: "/companion" }
] as const;

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-20 px-2">
          {mainNavItems.map(({ icon: Icon, image, displayLabel, href }) => {
            const isActive = location === href;
            
            return (
              <Link 
                key={href} 
                href={href}
                className="relative flex flex-col items-center justify-center gap-1 py-2"
              >
                {image ? (
                  <img 
                    src={image}
                    alt={displayLabel}
                    className={`w-5 h-5 rounded-full object-cover transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-60'
                    }`}
                  />
                ) : (
                  <Icon 
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`} 
                  />
                )}
                <span 
                  className={`text-[11px] font-normal tracking-wide uppercase transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {displayLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-[100] w-16 bg-background border-r border-border flex-col items-center py-8">
        {mainNavItems.map(({ icon: Icon, image, displayLabel, href }) => {
          const isActive = location === href;
          return (
            <Link 
              key={href} 
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-md transition-all duration-200 ease-out mb-4 group ${
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {image ? (
                <img 
                  src={image}
                  alt={displayLabel}
                  className={`w-6 h-6 rounded-full object-cover transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-60'
                  }`}
                />
              ) : (
                <Icon className="w-6 h-6 transition-transform" />
              )}
              <span className="text-[11px] font-normal tracking-wide uppercase opacity-0 group-hover:opacity-100 absolute left-16 bg-card text-card-foreground px-3 py-2 rounded-md whitespace-nowrap border border-border transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                {displayLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
