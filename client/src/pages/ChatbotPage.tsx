import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { 
  Loader2, Send, Bot, User, Globe,
  Wine, HeartHandshake, Plane, 
  Building, MapPin, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientHeader } from "@/components/ui/GradientHeader";
import { DIGITAL_NOMAD_CITIES } from "@/lib/constants";
import { useTranslation } from "@/lib/translations";
import { useLanguage } from "@/lib/language-context";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
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
    text: "City Guide",
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
  const quickPrompts = getQuickPrompts(t, language);
  const { toast } = useToast();
  
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
  
  // Show toast notification on page load
  useEffect(() => {
    toast({
      title: "Welcome to Maly's Concierge (Beta V1.5)",
      description: "Restaurant Reservations, Hotel Bookings, and Community Curated Recs coming soon.",
      duration: 6000,
    });
  }, [toast]);

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
              className="h-8 w-auto"
            />
            <HamburgerMenu />
          </div>
          
          {/* Row 2: Page title */}
          <h1 className="gradient-text text-lg font-medium uppercase pb-2" style={{ letterSpacing: '0.3em' }}>
            C O N C I E R G E
          </h1>
          
          {/* Row 3: Back button */}
          <div className="pb-2">
            <button
              onClick={() => window.history.back()}
              className="text-foreground hover:text-foreground/70 p-1"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* City selector */}
        <div className="max-w-2xl mx-auto mb-4">
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-transparent border border-border rounded-md px-3 py-2 text-sm w-full sm:w-auto text-foreground"
            aria-label="Select a city"
          >
            {DIGITAL_NOMAD_CITIES.map(city => (
              <option key={city} value={city} className="bg-background text-foreground">{city}</option>
            ))}
          </select>
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "assistant"
                        ? "bg-gradient-to-r from-purple-600 via-pink-600 to-red-500"
                        : "bg-accent"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-4 max-w-[85%] md:max-w-[80%] break-words ${
                      message.role === "assistant"
                        ? "bg-muted/30 glass"
                        : "bg-gradient-to-r from-purple-600 via-pink-600 to-red-500"
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
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
                  placeholder={`${t('askAnythingAbout')} ${selectedCity}...`}
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
    </div>
  );
}