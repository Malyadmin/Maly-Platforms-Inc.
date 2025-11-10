import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";

export default function AboutMalyPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background dark:bg-black border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-foreground p-2 hover:bg-foreground/10"
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <h1 className="gradient-text text-lg font-medium uppercase tracking-widest">
            About Maly
          </h1>
          
          <HamburgerMenu />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4 gradient-text">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Maly is a platform designed to connect digital nomads, travelers, and like-minded individuals 
              around the world. We believe in creating meaningful connections through shared experiences, 
              events, and authentic interactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 gradient-text">What We Do</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Maly helps you discover and create events tailored to your vibe and interests. Whether you're 
              looking to network, party, explore, or simply connect with others, Maly brings people together 
              in the places they love.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Discover curated events in your city</li>
              <li>Connect with fellow nomads and travelers</li>
              <li>Create and host your own experiences</li>
              <li>Build authentic relationships on the go</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 gradient-text">Our Community</h2>
            <p className="text-muted-foreground leading-relaxed">
              Join a vibrant community of explorers, creators, and adventurers who share your passion 
              for new experiences. From casual meetups to exclusive events, Maly is your gateway to a 
              world of possibilities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 gradient-text">Get in Touch</h2>
            <p className="text-muted-foreground leading-relaxed">
              Have questions or feedback? We'd love to hear from you. Reach out to us at{" "}
              <a href="mailto:hello@maly.app" className="text-purple-400 hover:underline">
                hello@maly.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
