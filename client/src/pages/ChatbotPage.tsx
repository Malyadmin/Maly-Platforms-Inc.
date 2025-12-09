import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { 
  Loader2, Send, Bot, User, Globe,
  Wine, HeartHandshake, Plane, 
  Building, MapPin, ChevronLeft, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientHeader } from "@/components/ui/GradientHeader";
import { CITIES_BY_REGION } from "@/lib/constants";
import { useTranslation } from "@/lib/translations";
import { useLanguage } from "@/lib/language-context";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useToast } from "@/hooks/use-toast";

// Quick prompts for the most common questions with specialized internal prompts
const getQuickPrompts = (t: (key: string) => string, language: string) => [
  {
    text: t('bestRooftops'),
    icon: Wine,
    // What users see
    prompt: language === 'es' 
      ? "¿Cuáles son los mejores bares y restaurantes en azoteas con vistas?" 
      : "What are the best rooftop bars and restaurants with views?",
    // Internal specialized prompt sent to the AI
    specializedPrompt: "What are the rooftops you actually tell your friends about? Not the corporate hotel bars, but places with soul—unexpected views, great music, elevated cocktails, or even hole-in-the-wall gems above the city. Think neighborhood rooftops, secret stairs, or spots where locals linger, not just influencers.",
    ariaLabel: "Find best rooftops"
  },
  {
    text: t('bestDateSpots'),
    icon: HeartHandshake,
    prompt: language === 'es'
      ? "¿Cuáles son los lugares más románticos e impresionantes para una cita?"
      : "What are the most romantic and impressive date spots?",
    specializedPrompt: "Share your go-to spots for a memorable date—places with atmosphere, intention, and a story. Think hidden courtyards, candlelit rooftops, wine bars with character, local chefs doing something special, or even a spot with a perfect view. Avoid the obvious—this is for people who love places that feel discovered, not advertised.",
    ariaLabel: "Find best date spots"
  },
  {
    text: t('bestDayTrips'),
    icon: Plane,
    prompt: language === 'es'
      ? "¿Cuáles son las mejores excursiones de un día desde aquí?"
      : "What are the best day trips from here?",
    specializedPrompt: "What's your favorite escape from the city for the day? Think quiet coastal towns, nature reserves, hot springs, hidden vineyards, artists' enclaves, or food adventures off the beaten path. Skip the tourist-packed landmarks—we want places that feel like secrets worth keeping but only a few hrs away.",
    ariaLabel: "Find best day trips"
  },
  {
    text: t('cityGuide'),
    icon: MapPin,
    prompt: language === 'es'
      ? "¿Cuál es la mejor guía para explorar esta ciudad?"
      : "What's the best guide to explore this city?",
    specializedPrompt: "Imagine you're curating a city guide for someone who's lived in Paris, dined in Tokyo, and hikes on weekends. What are your essential picks—neighborhood walks, independent coffee shops, local mezcalerías, sunset spots, live music dens, family-run kitchens, or under-the-radar galleries? No chains. No clichés. Just places with depth, story, and soul and that are hip.",
    ariaLabel: "City Guide"
  }
];

// Message animation variants
const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export default function ChatbotPage() {
  const { messages, setMessages, isLoading, sendMessage } = useChat();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("Mexico City");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const quickPrompts = getQuickPrompts(t, language);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Initialize messages with translated greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: t('conciergeGreeting')
        }
      ]);
    }
  }, [language, messages, setMessages, t]);
  
  // Show toast notification on page load (only once per session)
  useEffect(() => {
    const toastKey = 'maly_concierge_toast_shown';
    if (!sessionStorage.getItem(toastKey)) {
      sessionStorage.setItem(toastKey, 'true');
      toast({
        title: t('welcomeConcierge'),
        description: t('conciergeBetaDescription'),
        duration: 6000,
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = `[City: ${selectedCity}] ${input.trim()}`;
    setInput("");
    try {
      await sendMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleQuickPrompt = async (prompt: string, specializedPrompt?: string) => {
    if (isLoading) return;
    const message = `[City: ${selectedCity}] ${prompt}`;
    try {
      await sendMessage(message, specializedPrompt);
    } catch (error) {
      console.error("Error sending quick prompt:", error);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Custom Concierge Header - MALY logo, title, back button stacked */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 pt-3">
          {/* Row 1: MALY Logo left, Hamburger right */}
          <div className="flex items-center justify-between pb-2">
            <img 
              src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
              alt="MÁLY" 
              className="h-14 w-auto logo-adaptive"
            />
            <HamburgerMenu />
          </div>
          
          {/* Row 2: Back button + Page title inline */}
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.history.back()}
                className="text-foreground hover:text-foreground/70 p-1"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-foreground text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
                C O N C I E R G E
              </h1>
            </div>
            <p className="text-muted-foreground text-xs mt-1">Get local insights, tailored to your vibe.</p>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* City selector */}
        <div className="max-w-2xl mx-auto mb-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="bg-transparent border border-border rounded-md px-3 py-2 text-sm w-full sm:w-auto text-foreground flex items-center justify-between gap-2 min-w-[200px]"
            aria-label="Select a city"
          >
            <span>{selectedCity}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showCityDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 min-w-[250px] max-h-[400px] overflow-y-auto">
              {Object.entries(CITIES_BY_REGION).map(([region, countries]) => (
                <div key={region}>
                  <div className="px-4 py-2 text-xs font-semibold text-foreground uppercase">
                    {region}
                  </div>
                  {Object.entries(countries).map(([country, cities]) => (
                    <div key={country}>
                      <div className="px-4 py-1 text-xs text-muted-foreground bg-background/50">
                        {country}
                      </div>
                      {cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => { setSelectedCity(city); setShowCityDropdown(false); }}
                          className={`w-full text-left px-6 py-2 text-sm hover:bg-accent ${selectedCity === city ? 'text-foreground' : 'text-foreground'}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* Quick prompts */}
          <div className="bg-muted/20 border border-border rounded-lg mb-4 p-4">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map(({ text, icon: Icon, prompt, specializedPrompt, ariaLabel }) => (
                <Button
                  key={text}
                  variant="outline"
                  size="sm"
                  className="border-border hover:bg-foreground/10 glass-hover flex items-center gap-2 interactive-hover flex-1 min-w-fit"
                  onClick={() => handleQuickPrompt(prompt, specializedPrompt)}
                  disabled={isLoading}
                  aria-label={ariaLabel}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{text}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Messages */}
          <div className="bg-muted/20 border border-border rounded-lg mb-4">
            <div className="p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 mb-4 ${
                    message.role === "assistant" ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                      message.role === "assistant"
                        ? "bg-white border border-black dark:border-transparent"
                        : "bg-accent"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <img 
                        src="https://res.cloudinary.com/dwmolc54p/image/upload/v1765146570/avatars/maly_ai_agent_avatar.jpg" 
                        alt="MALY AI" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-4 max-w-[85%] md:max-w-[80%] break-words ${
                      message.role === "assistant"
                        ? "bg-muted/30 glass"
                        : "bg-white text-black"
                    }`}
                  >
                    <div className="text-sm">
                      {message.content.split('\n').map((line, idx) => {
                        // Match numbered list items (1., 2., etc.)
                        if (/^\d+\./.test(line)) {
                          return (
                            <li key={idx} className="pl-2 ml-4 list-item list-decimal">
                              {line.replace(/^\d+\.\s*/, '')}
                            </li>
                          );
                        }
                        // Match bullet list items
                        else if (line.startsWith('•')) {
                          return (
                            <li key={idx} className="pl-2 ml-4 list-item list-disc">
                              {line.slice(1).trim()}
                            </li>
                          );
                        }
                        // Regular paragraph text
                        else if (line.trim()) {
                          return <p key={idx} className="mb-2">{line}</p>;
                        }
                        // Empty lines become spacing
                        else {
                          return <div key={idx} className="h-2"></div>;
                        }
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://res.cloudinary.com/dwmolc54p/image/upload/v1765146570/avatars/maly_ai_agent_avatar.jpg" 
                      alt="MALY AI" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-lg p-4 bg-muted/30 glass flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-muted-foreground">{t('findingLocalInsights')}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`How can I help you explore ${selectedCity} today?`}
                  disabled={isLoading}
                  className="bg-muted/20 border-border glass-hover focus-visible"
                  aria-label="Type your message"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="px-8 interactive-hover"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}