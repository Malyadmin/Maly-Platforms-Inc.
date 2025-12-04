import { ChevronLeft } from "lucide-react";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";

export default function AboutMalyPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground flex flex-col">
      {/* Header - MALY logo, title, back button stacked */}
      <header className="sticky top-0 z-40 bg-background dark:bg-black border-b border-border">
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
          
          {/* Row 2: Back button + Page title inline, left justified */}
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => window.history.back()}
              className="text-foreground hover:text-foreground/70 p-1"
              aria-label="Go back"
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
              A B O U T
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <section>
            <h2 className="text-sm font-medium text-foreground tracking-wide uppercase mb-4">OUR MISSION</h2>
            <p className="text-foreground leading-relaxed">
              Maly is a platform designed to connect digital nomads, travelers, and like-minded individuals 
              around the world. We believe in creating meaningful connections through shared experiences, 
              events, and authentic interactions.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-foreground tracking-wide uppercase mb-4">WHAT WE DO</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Maly helps you discover and create events tailored to your vibe and interests. Whether you're 
              looking to network, party, explore, or simply connect with others, Maly brings people together 
              in the places they love.
            </p>
            <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
              <li>Discover curated events in your city</li>
              <li>Connect with fellow nomads and travelers</li>
              <li>Create and host your own experiences</li>
              <li>Build authentic relationships on the go</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-medium text-foreground tracking-wide uppercase mb-4">OUR COMMUNITY</h2>
            <p className="text-foreground leading-relaxed">
              Join a vibrant community of explorers, creators, and adventurers who share your passion 
              for new experiences. From casual meetups to exclusive events, Maly is your gateway to a 
              world of possibilities.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-foreground tracking-wide uppercase mb-4">GET IN TOUCH</h2>
            <p className="text-foreground leading-relaxed">
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
