import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, CreditCard, DollarSign, Shield, ArrowRight } from 'lucide-react';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';

interface ConnectAccountStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export default function StripeConnectPage() {
  console.log('StripeConnectPage component rendered');
  const { user } = useUser();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    console.log('StripeConnectPage useEffect triggered');
    fetchAccountStatus();
  }, []);

  const fetchAccountStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/account-status', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Failed to fetch account status:', response.status);
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 500) {
          toast({
            title: "Configuration Error",
            description: "Stripe Connect is not properly configured. Please contact support.",
            variant: "destructive",
          });
        }
        
        setStatus({ hasAccount: false, onboardingComplete: false });
      }
    } catch (error) {
      console.error('Error fetching account status:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to payment services. Please try again later.",
        variant: "destructive",
      });
      setStatus({ hasAccount: false, onboardingComplete: false });
    } finally {
      setLoading(false);
    }
  };

  const createConnectAccount = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Account Created",
          description: "Your Stripe Connect account has been created successfully!",
        });
        await fetchAccountStatus();
        await startOnboarding();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const startOnboarding = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create onboarding link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
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
                Payment Setup
              </h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
        <BottomNav />
      </div>
    );
  }

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
              Payment Setup
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-black dark:text-gray-300 text-center">
              Set up your payment account to receive payouts from ticket sales
            </p>
            
            {import.meta.env.MODE === 'development' && (
              <Alert className="mt-4 bg-orange-950 border-orange-800">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-200">
                  <strong>Development Mode:</strong> Stripe Connect requires deployment with proper webhook URLs. 
                  The payment setup may not work fully until the app is deployed with configured webhook endpoints.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg text-foreground">Direct Payouts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Receive payments directly to your bank account within 2-7 business days
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg text-foreground">Easy Checkout</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Professional checkout experience powered by Stripe for your attendees
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-foreground" />
                  <CardTitle className="text-lg text-foreground">Secure & Compliant</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bank-level security and PCI compliance handled automatically
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Account Status</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your current payment setup status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!status?.hasAccount ? (
                <>
                  <Alert className="bg-background border-border">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-gray-300">
                      You need to set up a payment account to receive payouts from ticket sales.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={createConnectAccount} 
                      disabled={processing}
                      size="lg"
                      className="w-full bg-white hover:bg-gray-100 text-black"
                      data-testid="button-get-started"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    {window.location.hostname.includes('replit') && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">
                          Development Preview Only
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-border text-gray-300 hover:bg-gray-800"
                          onClick={() => {
                            toast({
                              title: "Demo Mode",
                              description: "This shows how the payment setup would work when deployed.",
                            });
                            setStatus({
                              hasAccount: true,
                              onboardingComplete: true,
                              chargesEnabled: true,
                              payoutsEnabled: true,
                              detailsSubmitted: true
                            });
                          }}
                          data-testid="button-preview-complete"
                        >
                          Preview Setup Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Connect Account</span>
                    <Badge variant="outline" className="bg-green-950 text-green-400 border-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Created
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Onboarding Complete</span>
                    {status.onboardingComplete ? (
                      <Badge variant="outline" className="bg-green-950 text-green-400 border-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-950 text-yellow-400 border-yellow-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  {status.chargesEnabled !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Accept Payments</span>
                      <Badge variant="outline" className={status.chargesEnabled ? "bg-green-950 text-green-400 border-green-800" : "bg-red-950 text-red-400 border-red-800"}>
                        {status.chargesEnabled ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Disabled
                          </>
                        )}
                      </Badge>
                    </div>
                  )}

                  {status.payoutsEnabled !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Receive Payouts</span>
                      <Badge variant="outline" className={status.payoutsEnabled ? "bg-green-950 text-green-400 border-green-800" : "bg-red-950 text-red-400 border-red-800"}>
                        {status.payoutsEnabled ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Disabled
                          </>
                        )}
                      </Badge>
                    </div>
                  )}

                  {!status.onboardingComplete && (
                    <div className="pt-4">
                      <Alert className="mb-4 bg-background border-border">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <AlertDescription className="text-gray-300">
                          Complete your onboarding to start receiving payments from ticket sales.
                        </AlertDescription>
                      </Alert>
                      
                      <Button 
                        onClick={startOnboarding} 
                        disabled={processing}
                        size="lg"
                        className="w-full bg-white hover:bg-gray-100 text-black"
                        data-testid="button-complete-setup"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          <>
                            Complete Setup
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {status.onboardingComplete && (
                    <Alert className="bg-green-950 border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300">
                        Your payment account is fully set up! You can now receive payouts from ticket sales.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Fees & Payouts</CardTitle>
              <CardDescription className="text-muted-foreground">
                How payments work on Maly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-gray-300">Platform Fee</span>
                  <Badge variant="outline" className="border-border text-black dark:text-gray-300">3%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-gray-300">You Receive</span>
                  <Badge variant="outline" className="bg-green-950 text-green-400 border-green-800">97%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-gray-300">Payout Schedule</span>
                  <span className="text-sm text-muted-foreground">2-7 business days</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  Example: For a $100 ticket, you receive $97 and Maly collects $3 as a platform fee.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
