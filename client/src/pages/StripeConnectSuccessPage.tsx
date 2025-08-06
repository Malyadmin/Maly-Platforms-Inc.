import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, DollarSign } from 'lucide-react';
import { Link } from 'wouter';

export default function StripeConnectSuccessPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/create-event';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            Payment Setup Complete!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your Stripe Connect account has been successfully configured
          </p>
        </div>

        <Card className="text-left">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              What's Next?
            </CardTitle>
            <CardDescription>
              You're now ready to start selling tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Direct Payouts Enabled</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive 97% of ticket sales directly to your bank account within 2-7 business days
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Professional Checkout</h3>
              <p className="text-sm text-muted-foreground">
                Your attendees will experience a secure, professional checkout process
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Ready to Sell Tickets</h3>
              <p className="text-sm text-muted-foreground">
                Create your first paid event and start generating revenue
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Link href="/create-event">
            <Button size="lg" className="w-full">
              Create Your First Paid Event
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Link href="/stripe/connect">
            <Button variant="outline" size="lg" className="w-full">
              View Payment Settings
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Redirecting to event creation in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}