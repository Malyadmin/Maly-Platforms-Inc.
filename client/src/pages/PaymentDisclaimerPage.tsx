import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";

export default function PaymentDisclaimerPage() {
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

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
          
          <h1 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
            P A Y M E N T S
          </h1>
          
          <HamburgerMenu />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Brief Section */}
          <section className="bg-muted/20 border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Payment Information</h2>
            <p className="text-foreground leading-relaxed">
              Payments for event tickets are securely processed by Stripe. Maly acts solely as a marketplace. All ticket purchases are serviced and fulfilled directly by the event provider; any customer service or refund requests should be directed to the event organizer.
            </p>
          </section>

          {/* Learn More Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowFullDisclaimer(!showFullDisclaimer)}
              className="flex items-center gap-2 rounded-full border-white/40 bg-white/10 text-foreground hover:bg-white/20"
              data-testid="button-learn-more"
            >
              {showFullDisclaimer ? "Show Less" : "Learn More"}
              {showFullDisclaimer ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Full Legal Disclaimer (Collapsible) */}
          {showFullDisclaimer && (
            <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="border-t border-border pt-6">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Legal Payment Disclaimer</h2>
                
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    All payments on the Maly platform are processed securely through Stripe, a third-party payment processor. By purchasing event tickets on Maly, you agree to Stripe's terms of service, privacy policy, and applicable financial regulations.
                  </p>

                  <p>
                    Maly acts solely as an intermediary marketplace and does not organize, host, or manage any events. All event tickets are sold and fulfilled directly by independent event providers. Maly does not guarantee the quality, conduct, or outcome of any event and accepts no responsibility for event management, cancellations, or changes.
                  </p>

                  <p>
                    Payment transactions, including refunds and chargebacks, are subject to Stripe's policies as well as the individual event provider's refund and cancellation terms. If you have questions about ticket refunds, event changes, or disputes, please contact the event provider directly. Maly is not responsible for resolving disputes, processing refunds, or providing compensation for service issues, event cancellations, or dissatisfaction.
                  </p>

                  <p>
                    By using Maly and making purchases through Stripe, you acknowledge and accept that Maly cannot be held liable for any financial loss, damages, or claims arising from your use of the platform, your attendance at events, or your interactions with event providers. All personal and payment data is handled in accordance with Stripe's security and compliance standards.
                  </p>

                  <p className="pt-4">
                    For more information on Stripe's policies, please visit{" "}
                    <a 
                      href="https://stripe.com/legal" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Stripe's Terms of Service
                    </a>
                    {" "}and{" "}
                    <a 
                      href="https://stripe.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Privacy Policy
                    </a>.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
