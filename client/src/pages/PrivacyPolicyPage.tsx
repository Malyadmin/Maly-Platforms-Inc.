import { ChevronLeft } from "lucide-react";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function PrivacyPolicyPage() {
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
              Privacy
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: November 2024</p>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Account information (name, email, username, password)</li>
              <li>Profile information (bio, location, interests, profile picture)</li>
              <li>Event information (events you create, attend, or show interest in)</li>
              <li>Messages and communications with other users</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Connect you with other users and events</li>
              <li>Process payments and transactions</li>
              <li>Send you updates, notifications, and promotional materials</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Protect against fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">3. Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>With other users when you create public content or attend events</li>
              <li>With service providers who perform services on our behalf</li>
              <li>With payment processors to facilitate transactions</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a merger, sale, or acquisition of our business</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. However, 
              no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">5. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of promotional communications</li>
              <li>Request a copy of your data</li>
              <li>Object to certain data processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">6. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage 
              patterns, and deliver personalized content. You can control cookies through your browser 
              settings, but disabling cookies may limit certain features of our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">7. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Maly is not intended for users under the age of 18. We do not knowingly collect personal 
              information from children. If we become aware that a child has provided us with personal 
              information, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">8. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your country 
              of residence. We take appropriate measures to ensure your data is protected in accordance 
              with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes by posting the new policy on this page and updating the "Last updated" date. 
              Your continued use of Maly after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at{" "}
              <a href="mailto:privacy@maly.app" className="text-foreground hover:underline">
                privacy@maly.app
              </a>
            </p>
          </section>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
