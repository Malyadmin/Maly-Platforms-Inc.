import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function StripeConnectReauthPage() {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const retryOnboarding = async () => {
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

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-yellow-900 mb-2">
            Setup Incomplete
          </h1>
          <p className="text-lg text-muted-foreground">
            Your payment setup needs to be completed
          </p>
        </div>

        <Alert className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            It looks like your Stripe Connect onboarding wasn't completed. This could happen if:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You closed the browser window during setup</li>
              <li>There was a connection issue</li>
              <li>Some required information is still needed</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Card className="text-left">
          <CardHeader>
            <CardTitle>What You Need to Do</CardTitle>
            <CardDescription>
              Complete your payment setup to start receiving payouts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">📋 Prepare Your Information</h3>
              <p className="text-sm text-muted-foreground">
                Have your business details, tax information, and bank account ready
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">⏱️ Allow Extra Time</h3>
              <p className="text-sm text-muted-foreground">
                The setup process typically takes 5-10 minutes to complete
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">🔒 Stay Secure</h3>
              <p className="text-sm text-muted-foreground">
                Only provide information on the official Stripe pages
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button 
            onClick={retryOnboarding} 
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
                <RefreshCw className="mr-2 h-4 w-4" />
                Continue Setup
              </>
            )}
          </Button>
          
          <Link href="/stripe/connect">
            <Button variant="outline" size="lg" className="w-full">
              Check Status
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Need help? Contact our support team for assistance with payment setup.
        </p>
      </div>
    </div>
  );
}