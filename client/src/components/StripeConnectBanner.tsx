import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CreditCard, DollarSign, ArrowRight, X } from 'lucide-react';
import { Link } from 'wouter';
import { useStripeConnect } from '@/hooks/use-stripe-connect';

interface StripeConnectBannerProps {
  eventPrice?: string;
  showForFreeEvents?: boolean;
  onDismiss?: () => void;
  isDismissible?: boolean;
}

export default function StripeConnectBanner({ 
  eventPrice, 
  showForFreeEvents = false,
  onDismiss,
  isDismissible = true
}: StripeConnectBannerProps) {
  const { status, canReceivePayments } = useStripeConnect();
  const [dismissed, setDismissed] = useState(false);
  
  const eventHasPrice = eventPrice && parseFloat(eventPrice) > 0;
  
  // Don't show if dismissed
  if (dismissed) return null;
  
  // Don't show if user can already receive payments
  if (canReceivePayments) return null;
  
  // Don't show for free events unless explicitly requested
  if (!eventHasPrice && !showForFreeEvents) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getAlertVariant = () => {
    if (eventHasPrice) return "destructive";
    return "default";
  };

  const getTitle = () => {
    if (eventHasPrice) {
      return "Payment Setup Required";
    }
    return "Set up payments for future events";
  };

  const getDescription = () => {
    if (eventHasPrice) {
      return "You need to set up your payment account to receive money from ticket sales.";
    }
    return "Set up your payment account now to sell tickets for future events.";
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5">
            {eventHasPrice ? (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            ) : (
              <CreditCard className="h-5 w-5 text-orange-600" />
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                {getTitle()}
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                {getDescription()}
              </p>
            </div>

            {eventHasPrice && (
              <div className="bg-white dark:bg-orange-900 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-800 dark:text-orange-200">Ticket Price:</span>
                  <span className="font-semibold text-orange-900 dark:text-orange-100">
                    ${parseFloat(eventPrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-orange-600 dark:text-orange-300">You'll receive (97%):</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${(parseFloat(eventPrice) * 0.97).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Link href="/stripe/connect">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-foreground">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Set Up Payments
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              {isDismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900"
                >
                  Later
                </Button>
              )}
            </div>
          </div>

          {isDismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-orange-400 hover:text-orange-600 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}