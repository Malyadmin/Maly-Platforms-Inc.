import { ChevronLeft } from "lucide-react";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-background dark:bg-black border-b border-border">
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between pb-2">
            <img 
              src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
              alt="MÁLY" 
              className="h-14 w-auto logo-adaptive"
            />
            <HamburgerMenu />
          </div>
          
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => window.history.back()}
              className="text-foreground hover:text-foreground/70 p-1"
              aria-label="Go back"
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-foreground text-lg font-medium uppercase" style={{ letterSpacing: '0.2em' }}>
              Terms
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: November 2024</p>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Maly, you accept and agree to be bound by the terms and provision 
              of this agreement. If you do not agree to these Terms & Conditions, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">2. Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Maly provides a platform for users to discover, create, and attend events. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide accurate and complete information when creating an account</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
              <li>Respect other users and maintain a safe community environment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">3. User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any content you post on Maly. By posting content, you grant us a 
              non-exclusive, worldwide, royalty-free license to use, reproduce, and display your content 
              in connection with the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">4. Event Creation and Attendance</h2>
            <p className="text-muted-foreground leading-relaxed">
              Event hosts are responsible for the accuracy of event information and the conduct of their events. 
              Maly is not responsible for the quality, safety, or legality of events listed on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">5. Payments and Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              Payment processing is handled through secure third-party providers. Refund policies are set 
              by individual event hosts. Maly may charge service fees for certain transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">6. Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You may not:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to terminate or suspend your account at any time, with or without notice, 
              for conduct that we believe violates these Terms & Conditions or is harmful to other users, us, 
              or third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Maly is provided "as is" without warranties of any kind. We are not liable for any damages 
              arising from your use of the service or attendance at events listed on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes via email or through the platform. Your continued use of Maly after such modifications 
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms & Conditions, please contact us at{" "}
              <a href="mailto:legal@maly.app" className="text-foreground hover:underline">
                legal@maly.app
              </a>
            </p>
          </section>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
