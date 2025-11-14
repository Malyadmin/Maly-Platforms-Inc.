import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Star, Shield, Gift, Zap, MessageSquare, Check, Loader2 } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { useToast } from "@/components/ui/use-toast";
import { PaymentHistory } from '../components/premium/PaymentHistory';
import { PageHeader } from "@/components/ui/page-header";

const features = [
  {
    icon: Gift,
    title: "Access to Exclusive Events",
    description: "Gain insider details on afterparties, VIP gatherings, and premium happenings"
  },
  {
    icon: Star,
    title: "Profile Enhancements",
    description: "Upload more photos, utilize advanced dating filters, and enjoy personalized profile customization"
  },
  {
    icon: Shield,
    title: "Dedicated Customer Support",
    description: "Experience priority assistance from our specialized support team"
  },
  {
    icon: Zap,
    title: "Ad Customization",
    description: "Choose to see tailored ads from brands you love or opt for an ad-free experience"
  },
  {
    icon: Gift,
    title: "Event Creation & Monetization",
    description: "Organize events and earn directly from ticket sales"
  },
  {
    icon: MessageSquare,
    title: "Premium Networking",
    description: "Connect and message exclusively with other Premium Members, talents, artists, and influencers worldwide"
  }
];

export default function PremiumPage() {
  const [, setLocation] = useLocation();
  const { user, refetchUser } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const [premiumStatus, setPremiumStatus] = useState<{
    isPremium: boolean;
    subscription: any;
    expiresAt: string | null;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Check premium status on load
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        setLoadingStatus(true);
        
        // Get session ID from localStorage
        const sessionId = localStorage.getItem('maly_session_id');
        
        const response = await fetch('/api/premium/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Include session ID in headers if available
            ...(sessionId ? { 'x-session-id': sessionId } : {})
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setPremiumStatus(data);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkPremiumStatus();
  }, []);

  const handleSubscribe = async () => {
    console.log('[PREMIUM] Get Premium Now button clicked', { user, subscriptionType });
    
    if (!user) {
      console.log('[PREMIUM] No user found, redirecting to auth');
      toast({
        title: "Please log in",
        description: "You must be logged in to subscribe",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    console.log('[PREMIUM] Starting checkout process for user:', user.username);
    setLoading(true);
    try {
      // Get session ID from localStorage if available
      const sessionId = localStorage.getItem('maly_session_id');
      console.log('[PREMIUM] Session ID from localStorage:', sessionId ? 'present' : 'missing');
      
      const response = await fetch('/api/premium/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include session ID in headers if available
          ...(sessionId ? { 'x-session-id': sessionId } : {})
        },
        body: JSON.stringify({
          subscriptionType
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Checkout error response:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      console.log('[PREMIUM] Checkout URL received:', url);
      
      // Redirect to Stripe Checkout
      if (url) {
        console.log('[PREMIUM] Redirecting to Stripe checkout...');
        window.location.href = url;
      } else {
        console.error('[PREMIUM] No checkout URL received');
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!premiumStatus?.subscription) return;
    
    setLoading(true);
    try {
      // Get session ID from localStorage
      const sessionId = localStorage.getItem('maly_session_id');
      
      const response = await fetch('/api/premium/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include session ID in headers if available
          ...(sessionId ? { 'x-session-id': sessionId } : {})
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      const result = await response.json();
      
      toast({
        title: "Subscription Canceled",
        description: result.message,
      });
      
      // Refresh premium status
      const statusResponse = await fetch('/api/premium/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include session ID in headers for status check too
          ...(sessionId ? { 'x-session-id': sessionId } : {})
        },
        credentials: 'include'
      });
      
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setPremiumStatus(data);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Premium Benefits"
        icon={Crown}
        backButtonFallbackPath="/"
        className="bg-background/40"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {loadingStatus ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : premiumStatus?.isPremium ? (
            <div className="flex flex-col gap-8">
              <div className="text-center mb-4 p-8 border border-purple-600/30 rounded-lg bg-purple-900/10">
                <Crown className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Premium Active</h2>
                {premiumStatus.expiresAt && (
                  <p className="text-muted-foreground mb-4">
                    Your subscription is active until {formatDate(premiumStatus.expiresAt)}
                  </p>
                )}
                
                {premiumStatus.subscription?.cancelAtPeriodEnd ? (
                  <div className="bg-amber-500/20 text-amber-300 p-3 rounded-md inline-block mb-4">
                    Your subscription will end on {formatDate(premiumStatus.expiresAt || '')}
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Cancel Subscription
                  </Button>
                )}
              </div>
              
              {/* Add Payment History component */}
              <PaymentHistory />
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  Unlock the World with Maly Premium
                </h2>
                <p className="text-muted-foreground text-lg">
                  Maximize your Maly experience for less than $1/day
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-12">
                {features.map((feature, index) => (
                  <Card key={index} className="bg-card hover:bg-foreground/10/5 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <feature.icon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-6 justify-center mb-8">
                <Card className={`w-full md:w-1/2 p-6 ${subscriptionType === 'monthly' ? 'border-purple-500' : ''}`}>
                  <CardContent className="p-0 text-center">
                    <h3 className="font-semibold text-xl mb-2">Monthly</h3>
                    <div className="text-4xl font-bold mb-2">$29</div>
                    <div className="text-muted-foreground mb-4">per month</div>
                    <Button 
                      variant={subscriptionType === 'monthly' ? "default" : "outline"}
                      className={subscriptionType === 'monthly' ? "bg-gradient-to-r from-purple-900 via-purple-800 to-black" : ""}
                      onClick={() => setSubscriptionType('monthly')}
                    >
                      {subscriptionType === 'monthly' ? <Check className="w-4 h-4 mr-2" /> : null}
                      Select
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className={`w-full md:w-1/2 p-6 ${subscriptionType === 'yearly' ? 'border-purple-500' : ''}`}>
                  <CardContent className="p-0 text-center">
                    <h3 className="font-semibold text-xl mb-2">Yearly</h3>
                    <div className="text-4xl font-bold mb-2">$290</div>
                    <div className="text-muted-foreground mb-1">per year</div>
                    <div className="text-green-500 text-sm mb-4">Save $58</div>
                    <Button 
                      variant={subscriptionType === 'yearly' ? "default" : "outline"}
                      className={subscriptionType === 'yearly' ? "bg-gradient-to-r from-purple-900 via-purple-800 to-black" : ""}
                      onClick={() => setSubscriptionType('yearly')}
                    >
                      {subscriptionType === 'yearly' ? <Check className="w-4 h-4 mr-2" /> : null}
                      Select
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-900 via-purple-800 to-black hover:from-purple-800 hover:via-purple-700 hover:to-gray-900 text-foreground border-0 px-8"
                  onClick={handleSubscribe}
                  data-testid="button-get-premium"
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Crown className="w-5 h-5 mr-2" />}
                  Get Premium Now
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
