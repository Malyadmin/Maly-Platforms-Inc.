import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Event {
  id: number;
  title: string;
  description: string;
  price: number | string;
  date: string;
  location: string;
  creatorName?: string;
}

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onSuccess: () => void;
}

interface CheckoutFormProps {
  event: Event;
  onSuccess: () => void;
  onClose: () => void;
}

function CheckoutForm({ event, onSuccess, onClose }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const eventPrice = typeof event.price === 'string' ? parseFloat(event.price) : event.price;
  const platformFee = eventPrice * 0.10; // 10% platform fee
  const totalAmount = eventPrice + platformFee;

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            eventId: event.id,
            amount: Math.round(totalAmount * 100), // Convert to cents
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    };

    if (eventPrice > 0) {
      createPaymentIntent();
    }
  }, [event.id, totalAmount, eventPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: "Your ticket has been purchased successfully.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Summary */}
      <Card className="bg-gradient-to-r from-gray-700/20 to-gray-600/20 border-gray-600/30">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">{event.title}</h3>
            <p className="text-sm text-foreground/70">
              {new Date(event.date).toLocaleDateString()} • {event.location}
            </p>
            {event.creatorName && (
              <p className="text-xs text-foreground/60">Hosted by {event.creatorName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 space-y-3">
          <h4 className="font-medium text-foreground">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/70">Ticket Price</span>
              <span className="text-foreground">${eventPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Platform Fee (10%)</span>
              <span className="text-foreground">${platformFee.toFixed(2)}</span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex justify-between font-medium">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-400" />
            <h4 className="font-medium text-foreground">Payment Method</h4>
          </div>
          
          <div className="p-3 bg-accent rounded-lg border border-white/20">
            <CardElement options={cardOptions} />
          </div>

          {paymentError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{paymentError}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-foreground/60">
            <Shield className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing || !clientSecret}
          className="flex-1 bg-white hover:bg-gray-100 text-black"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Pay ${totalAmount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function StripeCheckoutModal({ isOpen, onClose, event, onSuccess }: StripeCheckoutModalProps) {
  const eventPrice = typeof event.price === 'string' ? parseFloat(event.price) : event.price;

  if (eventPrice <= 0) {
    return null; // Don't show modal for free events
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Complete Your Purchase</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Secure your spot at this event with our secure payment system.
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <CheckoutForm event={event} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}