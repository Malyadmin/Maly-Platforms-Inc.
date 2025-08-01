import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Shield, Minus, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: number;
    title: string;
    price: string;
    image?: string;
    date: string;
    location: string;
  };
  onSuccess?: () => void;
}

export default function StripeCheckoutModal({ 
  isOpen, 
  onClose, 
  event, 
  onSuccess 
}: StripeCheckoutModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const pricePerTicket = parseFloat(event.price || '0');
  const subtotal = pricePerTicket * quantity;
  const platformFee = Math.round(subtotal * 0.03 * 100) / 100; // 3% fee
  const total = subtotal;

  const handleCheckout = async () => {
    setProcessing(true);
    setError(null);

    try {
      const sessionId = localStorage.getItem('maly_session_id');
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId: event.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = (window as any).Stripe?.(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        
        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Fallback: direct redirect if Stripe.js not loaded
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`;
      }
      
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateQuantity = (change: number) => {
    const newQuantity = Math.max(1, Math.min(10, quantity + change));
    setQuantity(newQuantity);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Review your order and proceed to secure checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-3">
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(event.date)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.location}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantity</span>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-semibold w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(1)}
                disabled={quantity >= 10}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal ({quantity} ticket{quantity > 1 ? 's' : ''})</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Platform fee (3%)</span>
              <span>-${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Host receives</span>
              <span>${(subtotal - platformFee).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure checkout powered by Stripe</span>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={processing}
            size="lg"
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ${total.toFixed(2)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to Stripe's secure checkout page to complete your payment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}