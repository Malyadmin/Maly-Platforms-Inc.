import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, ChevronDown, ChevronUp, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/language-context";
import { useTranslation } from "@/lib/translations";
import { useTheme } from "@/lib/theme-provider";

interface MenuSection {
  titleKey: string;
  itemKeys: string[];
}

const menuSections: MenuSection[] = [
  {
    titleKey: "accountAndProfile",
    itemKeys: [
      "editProfile",
      "notificationPreferences"
    ]
  },
  {
    titleKey: "creatorTools",
    itemKeys: [
      "creatorDashboard",
      "stripeConnect"
    ]
  },
  {
    titleKey: "companyAndLegal",
    itemKeys: [
      "aboutMaly",
      "termsAndConditions",
      "privacyPolicy",
      "paymentDisclaimer"
    ]
  }
];

interface LanguageOption {
  code: 'en' | 'es';
  label: string;
}

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  // Determine effective theme for toggle display
  const effectiveTheme = theme === "system" 
    ? (typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  const languageOptions: LanguageOption[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' }
  ];
  
  const routeMap: Record<string, string> = {
    "aiConcierge": "/companion",
    "editProfile": "/profile-edit",
    "notificationPreferences": "/notification-preferences",
    "creatorDashboard": "/creator/dashboard",
    "stripeConnect": "/stripe/connect",
    "aboutMaly": "/about",
    "termsAndConditions": "/terms",
    "privacyPolicy": "/privacy",
    "paymentDisclaimer": "/payment-disclaimer",
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const handleMenuItemClick = (itemKey: string) => {
    console.log('[HAMBURGER MENU] Clicked menu item:', itemKey);
    setOpen(false);
    
    const route = routeMap[itemKey];
    console.log('[HAMBURGER MENU] Mapped route:', route);
    if (route) {
      console.log('[HAMBURGER MENU] Navigating to:', route);
      setLocation(route);
    } else {
      console.log(`Navigate to: ${itemKey} (not yet implemented)`);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log('[HAMBURGER MENU] Logout button clicked');
      
      // Don't close menu yet - keep it open while logging out
      const response = await fetch('/api/logout', { 
        method: 'POST', 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[HAMBURGER MENU] Logout response:', response.status);
      
      if (response.ok) {
        console.log('[HAMBURGER MENU] Logout successful, clearing data and redirecting');
        // Clear all local storage
        localStorage.clear();
        
        // Clear session storage too
        sessionStorage.clear();
        
        // Force redirect to auth page
        window.location.href = '/auth';
      } else {
        console.error('[HAMBURGER MENU] Logout failed with status:', response.status);
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('[HAMBURGER MENU] Logout error:', error);
      alert('Logout error. Please try again.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(effectiveTheme === "dark" ? "light" : "dark")}
        className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/10 hover:bg-black/10 transition-colors"
        aria-label="Toggle theme"
        data-testid="button-theme-toggle"
      >
        {effectiveTheme === "dark" ? (
          <Sun className="w-5 h-5 text-white" />
        ) : (
          <Moon className="w-5 h-5 text-white" />
        )}
      </button>
      
      {/* Hamburger Menu */}
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
        className="w-72 bg-popover border-border text-foreground p-0 max-h-[80vh] overflow-y-auto"
        data-testid="hamburger-menu-content"
      >
        <div className="py-2">
          {menuSections.map((section, idx) => (
            <div key={section.titleKey} className={idx > 0 ? "border-t border-border" : ""}>
              <button
                onClick={() => toggleSection(section.titleKey)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors group"
                data-testid={`menu-section-${section.titleKey}`}
              >
                <span className={`text-xs font-semibold tracking-wider transition-all ${expandedSections.includes(section.titleKey) ? 'gradient-text' : 'text-muted-foreground group-hover:gradient-text'}`}>
                  {t(section.titleKey)}
                </span>
                {expandedSections.includes(section.titleKey) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.includes(section.titleKey) && (
                <div className="bg-muted/50">
                  {section.itemKeys.map((itemKey) => (
                    <button
                      key={itemKey}
                      className="w-full text-left px-8 py-2.5 text-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
                      data-testid={`menu-item-${itemKey}`}
                      onClick={() => handleMenuItemClick(itemKey)}
                    >
                      {t(itemKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Language section */}
          <div className="border-t border-border">
            <button
              onClick={() => toggleSection("language")}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors group"
              data-testid="menu-section-language"
            >
              <span className={`text-xs font-semibold tracking-wider transition-all ${expandedSections.includes("language") ? 'gradient-text' : 'text-muted-foreground group-hover:gradient-text'}`}>
                {t("language")}
              </span>
              {expandedSections.includes("language") ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            
            {expandedSections.includes("language") && (
              <div className="bg-muted/50">
                {languageOptions.map((option) => (
                  <button
                    key={option.code}
                    className={`w-full text-left px-8 py-2.5 text-sm transition-colors ${
                      language === option.code 
                        ? 'gradient-text font-semibold' 
                        : 'text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
                    }`}
                    data-testid={`menu-language-${option.code}`}
                    onClick={() => {
                      setLanguage(option.code);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Logout section */}
          <div className="border-t border-border">
            <button
              onClick={(e) => handleLogout(e)}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-400"
              data-testid="menu-logout"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wider">{t("logout").toUpperCase()}</span>
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
