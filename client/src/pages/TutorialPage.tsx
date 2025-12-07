import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Users,
  Calendar,
  Bot,
  MessageSquare,
  MapPin,
  SlidersHorizontal,
  UserPlus2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Tutorial images will be imported here
const images = {
  darkMode: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop",
  browse: "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=1200&h=600&fit=crop",
  chat: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1200&h=600&fit=crop",
  events: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=1200&h=600&fit=crop",
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8 text-center"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="text-4xl font-bold mb-4 text-accent-maly">Welcome to Neumada</h1>
          <p className="text-lg text-muted-foreground">
            Your digital nomad community platform
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <Tabs defaultValue="interface" className="space-y-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <TabsTrigger value="interface" className="gap-2 interactive-hover">
              <Globe className="w-4 h-4" />
              Interface
            </TabsTrigger>
            <TabsTrigger value="discovery" className="gap-2 interactive-hover">
              <Users className="w-4 h-4" />
              Discovery
            </TabsTrigger>
            <TabsTrigger value="companion" className="gap-2 interactive-hover">
              <Bot className="w-4 h-4" />
              AI Companion
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 interactive-hover">
              <Calendar className="w-4 h-4" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Interface & Navigation */}
          <AnimatePresence mode="wait">
            <TabsContent value="interface">
              <Card className="glass">
                <CardContent className="p-6 space-y-8">
                  <motion.section 
                    className="space-y-4"
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h2 
                      className="text-2xl font-semibold flex items-center gap-2 text-accent-maly"
                      variants={fadeIn}
                    >
                      <Globe className="w-6 h-6" />
                      Interface & Navigation
                    </motion.h2>

                    <motion.div 
                      className="grid md:grid-cols-2 gap-8"
                      variants={fadeIn}
                    >
                      <div className="space-y-4">
                        <h3 className="text-xl font-medium">Dark/Light Mode</h3>
                        <p className="text-muted-foreground">
                          Toggle between dark and light themes for comfortable viewing in any environment.
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            Click the theme toggle in the top right corner of the page
                          </span>
                        </div>
                      </div>
                      <motion.img
                        src={images.darkMode}
                        alt="Theme toggle demonstration"
                        className="rounded-lg shadow-card"
                        variants={fadeIn}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      />
                    </motion.div>

                    <motion.div 
                      className="border-t pt-8"
                      variants={fadeIn}
                    >
                      <h3 className="text-xl font-medium mb-4">Navigation</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: Globe, label: "Discover" },
                          { icon: Users, label: "Connect" },
                          { icon: Calendar, label: "Create" },
                          { icon: Bot, label: "Concierge" },
                        ].map(({ icon: Icon, label }) => (
                          <motion.div
                            key={label}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg glass interactive-hover"
                            variants={fadeIn}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{label}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.section>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="discovery">
              <Card className="glass">
                <CardContent className="p-6 space-y-8">
                  <motion.section className="space-y-4" variants={stagger} initial="hidden" animate="visible">
                    <motion.h2 className="text-2xl font-semibold flex items-center gap-2 text-accent-maly" variants={fadeIn}>
                      <Users className="w-6 h-6" />
                      User Discovery & Matching
                    </motion.h2>
                    <motion.div className="grid md:grid-cols-2 gap-8" variants={fadeIn}>
                      <div className="space-y-4">
                        <h3 className="text-xl font-medium">Browse Members</h3>
                        <p className="text-muted-foreground">
                          Find and connect with fellow digital nomads using our advanced filtering system.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>Location-based filtering</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                            <span>Demographics & interests</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserPlus2 className="w-4 h-4 text-muted-foreground" />
                            <span>AI-powered matching</span>
                          </div>
                        </div>
                      </div>
                      <motion.img
                        src={images.browse}
                        alt="Browse members interface"
                        className="rounded-lg shadow-card"
                        variants={fadeIn}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      />
                    </motion.div>
                  </motion.section>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="companion">
              <Card className="glass">
                <CardContent className="p-6 space-y-8">
                  <motion.section className="space-y-4" variants={stagger} initial="hidden" animate="visible">
                    <motion.h2 className="text-2xl font-semibold flex items-center gap-2 text-accent-maly" variants={fadeIn}>
                      <Bot className="w-6 h-6" />
                      AI Travel Companion
                    </motion.h2>
                    <motion.div className="grid md:grid-cols-2 gap-8" variants={fadeIn}>
                      <div className="space-y-4">
                        <h3 className="text-xl font-medium">Interactive Chat</h3>
                        <p className="text-muted-foreground">
                          Get personalized travel recommendations and local insights from our AI companion.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span>Context-aware responses</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span>Local recommendations</span>
                          </div>
                        </div>
                      </div>
                      <motion.img
                        src={images.chat}
                        alt="AI chat interface"
                        className="rounded-lg shadow-card"
                        variants={fadeIn}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      />
                    </motion.div>
                  </motion.section>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="events">
              <Card className="glass">
                <CardContent className="p-6 space-y-8">
                  <motion.section className="space-y-4" variants={stagger} initial="hidden" animate="visible">
                    <motion.h2 className="text-2xl font-semibold flex items-center gap-2 text-accent-maly" variants={fadeIn}>
                      <Calendar className="w-6 h-6" />
                      Events System
                    </motion.h2>
                    <motion.div className="grid md:grid-cols-2 gap-8" variants={fadeIn}>
                      <div className="space-y-4">
                        <h3 className="text-xl font-medium">Event Management</h3>
                        <p className="text-muted-foreground">
                          Create, discover, and join events with fellow digital nomads in your area.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>Location-based discovery</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Category filtering</span>
                          </div>
                        </div>
                      </div>
                      <motion.img
                        src={images.events}
                        alt="Events interface"
                        className="rounded-lg shadow-card"
                        variants={fadeIn}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      />
                    </motion.div>
                  </motion.section>
                </CardContent>
              </Card>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}