import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-gray-800">
        <div className="flex items-center justify-between px-5 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white p-2 hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <h1 className="gradient-text text-lg font-medium uppercase tracking-widest">
            Privacy Policy
          </h1>
          
          <HamburgerMenu />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: November 2024</p>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">1. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Account information (name, email, username, password)</li>
              <li>Profile information (bio, location, interests, profile picture)</li>
              <li>Event information (events you create, attend, or show interest in)</li>
              <li>Messages and communications with other users</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">2. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
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
            <h2 className="text-xl font-bold mb-3 text-white">3. Information Sharing and Disclosure</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>With other users when you create public content or attend events</li>
              <li>With service providers who perform services on our behalf</li>
              <li>With payment processors to facilitate transactions</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a merger, sale, or acquisition of our business</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">4. Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. However, 
              no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">5. Your Rights and Choices</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of promotional communications</li>
              <li>Request a copy of your data</li>
              <li>Object to certain data processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">6. Cookies and Tracking Technologies</h2>
            <p className="text-gray-300 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage 
              patterns, and deliver personalized content. You can control cookies through your browser 
              settings, but disabling cookies may limit certain features of our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">7. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Maly is not intended for users under the age of 18. We do not knowingly collect personal 
              information from children. If we become aware that a child has provided us with personal 
              information, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">8. International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country 
              of residence. We take appropriate measures to ensure your data is protected in accordance 
              with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">9. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes by posting the new policy on this page and updating the "Last updated" date. 
              Your continued use of Maly after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-white">10. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at{" "}
              <a href="mailto:privacy@maly.app" className="text-purple-400 hover:underline">
                privacy@maly.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
