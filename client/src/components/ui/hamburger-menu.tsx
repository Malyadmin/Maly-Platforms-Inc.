import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuSection {
  title: string;
  items: string[];
}

const menuSections: MenuSection[] = [
  {
    title: "ACCOUNT AND PROFILE",
    items: [
      "Edit Profile",
      "Payment Methods",
      "Manage Subscriptions",
      "Notification Preferences",
      "Privacy & Visibility"
    ]
  },
  {
    title: "CREATOR TOOLS",
    items: [
      "Creator Dashboard"
    ]
  },
  {
    title: "COMPANY AND LEGAL",
    items: [
      "About Maly",
      "Terms & Conditions",
      "Privacy Policy",
      "System"
    ]
  }
];

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const handleMenuItemClick = (item: string) => {
    console.log('[HAMBURGER MENU] Clicked menu item:', item);
    setOpen(false);
    
    // Map menu items to routes
    const routeMap: Record<string, string> = {
      "Creator Dashboard": "/creator/dashboard",
      "Edit Profile": "/profile-edit",
      // Add more routes as needed
    };
    
    const route = routeMap[item];
    console.log('[HAMBURGER MENU] Mapped route:', route);
    if (route) {
      console.log('[HAMBURGER MENU] Navigating to:', route);
      setLocation(route);
    } else {
      console.log(`Navigate to: ${item} (not yet implemented)`);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white p-2 hover:bg-white/10"
          data-testid="hamburger-menu-button"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-black border-gray-800 text-white p-0 max-h-[80vh] overflow-y-auto"
        data-testid="hamburger-menu-content"
      >
        <div className="py-2">
          {menuSections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "border-t border-gray-800" : ""}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                data-testid={`menu-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="gradient-text text-xs font-semibold tracking-wider">
                  {section.title}
                </span>
                {expandedSections.includes(section.title) ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.includes(section.title) && (
                <div className="bg-gray-900/50">
                  {section.items.map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-8 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      data-testid={`menu-item-${item.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleMenuItemClick(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Logout section */}
          <div className="border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-400"
              data-testid="menu-logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wider">LOGOUT</span>
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
