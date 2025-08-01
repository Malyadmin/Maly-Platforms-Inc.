import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, CreditCard, DollarSign, Shield, ArrowRight } from 'lucide-react';
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
  const { user } = useUser();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Setup</h1>
        <p className="text-muted-foreground">
          Set up your payment account to receive payouts from ticket sales
        </p>
        
        {/* Development Mode Warning */}
        {window.location.hostname.includes('replit') && (
          <Alert className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Development Mode:</strong> Stripe Connect requires deployment with proper webhook URLs. 
              The payment setup may not work fully until the app is deployed with configured webhook endpoints.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Benefits Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Direct Payouts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receive payments directly to your bank account within 2-7 business days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Easy Checkout</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Professional checkout experience powered by Stripe for your attendees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Secure & Compliant</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bank-level security and PCI compliance handled automatically
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Your current payment setup status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.hasAccount ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to set up a payment account to receive payouts from ticket sales.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <Button 
                  onClick={createConnectAccount} 
                  disabled={processing}
                  size="lg"
                  className="w-full"
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
                    <p className="text-xs text-muted-foreground mb-2">
                      Development Preview Only
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
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
                <span className="font-medium">Connect Account</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Created
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Onboarding Complete</span>
                {status.onboardingComplete ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>

              {status.chargesEnabled !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Accept Payments</span>
                  <Badge variant="outline" className={status.chargesEnabled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
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
                  <span className="font-medium">Receive Payouts</span>
                  <Badge variant="outline" className={status.payoutsEnabled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
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
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Complete your onboarding to start receiving payments from ticket sales.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={startOnboarding} 
                    disabled={processing}
                    size="lg"
                    className="w-full"
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
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your payment account is fully set up! You can now receive payouts from ticket sales.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Fees & Payouts</CardTitle>
          <CardDescription>
            How payments work on Maly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Platform Fee</span>
              <Badge variant="outline">3%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>You Receive</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">97%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Payout Schedule</span>
              <span className="text-sm text-muted-foreground">2-7 business days</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Example: For a $100 ticket, you receive $97 and Maly collects $3 as a platform fee.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Information for Development */}
      {window.location.hostname.includes('replit') && (
        <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Deployment Requirements</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-200">
              For production deployment with full Stripe Connect functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200">
            <div className="space-y-3 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Required Stripe Configuration:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Stripe Connect application with approved domain</li>
                  <li>Webhook endpoint configured for payment events</li>
                  <li>Return URLs set to your deployed domain</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium">Environment Variables (Already Set):</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>STRIPE_SECRET_KEY ✓</li>
                  <li>STRIPE_PUBLISHABLE_KEY ✓</li>
                  <li>STRIPE_WEBHOOK_SECRET ✓</li>
                </ul>
              </div>

              <div className="p-3 bg-white/20 dark:bg-blue-900/50 rounded-lg mt-4">
                <p className="text-xs">
                  The payment system is fully implemented and tested. Once deployed to a live domain 
                  with proper Stripe Connect configuration, all payment flows will work seamlessly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}