import { useLocation } from "wouter";
import { 
  ChevronRight, 
  Home, 
  Settings, 
  Users, 
  DollarSign, 
  MessageSquare, 
  CalendarDays, 
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/payments", label: "Payment Management", icon: DollarSign },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/events", label: "Event Management", icon: CalendarDays },
  { href: "/admin/messages", label: "Message Center", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Admin Settings", icon: Settings },
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location === "/admin";
    }
    return location.startsWith(path);
  };

  return (
    <aside className="hidden lg:block w-64 border-r border-border h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-lg font-bold mb-1">Admin Panel</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your platform
        </p>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className={cn(
                "flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-foreground/10/50 transition-colors",
                isActive(item.href)
                  ? "bg-accent/50 font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span>{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
} 