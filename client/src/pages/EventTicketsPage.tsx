import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/translations';

// Initialize Stripe Promise
let stripePromise: Promise<any | null>;
const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("Stripe publishable key is not set in environment variables.");
      return Promise.resolve(null); // Return a promise that resolves to null
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Ticket Tier interface
interface TicketTier {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
  price: string;
  quantity: number | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  isActive: boolean;
}

// Event interface
interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  price: number | string;
  availableTickets: number;
  imageUrl: string;
  creatorId: number;
  creatorName?: string;
  ticketTiers?: TicketTier[];
}

export default function EventTicketsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const { t } = useTranslation();

  // Fetch event details
  const { data: event, isLoading, isError } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Handle authentication check
  useEffect(() => {
    if (!user && !isLoading) {
      setLocation('/auth');
    }
  }, [user, setLocation, isLoading]);

  // Auto-select first active tier when event loads
  useEffect(() => {
    if (event?.ticketTiers && event.ticketTiers.length > 0 && !selectedTierId) {
      const firstActiveTier = event.ticketTiers.find(tier => tier.isActive);
      if (firstActiveTier) {
        setSelectedTierId(firstActiveTier.id);
      }
    }
  }, [event, selectedTierId]);

  // Get selected tier
  const selectedTier = event?.ticketTiers?.find(tier => tier.id === selectedTierId);

  // Calculate totals
  const subtotal = selectedTier ? parseFloat(selectedTier.price) * quantity : 0;
  
  const fees = subtotal * 0.05; // 5% service fee
  const total = subtotal + fees;

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value < 1 || isNaN(value)) {
      setQuantity(1);
    } else if (event && event.availableTickets && value > event.availableTickets) {
      setQuantity(event.availableTickets);
    } else {
      setQuantity(value);
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!event || !event.id || !selectedTierId) {
      setError('Please select a ticket tier');
      return;
    }
    setError(null);
    setIsProcessing(true);

    try {
      // Get authentication tokens from localStorage
      const sessionId = localStorage.getItem('maly_session_id');
      const userId = localStorage.getItem('maly_user_id');
      const userData = localStorage.getItem('maly_user_data');
      const userObj = userData ? JSON.parse(userData) : null;
      
      // Log authentication info for debugging
      console.log('Auth info for purchase:', { 
        hasSessionId: !!sessionId,
        sessionIdPrefix: sessionId ? sessionId.substring(0, 5) + '...' : 'none',
        hasUserId: !!userId,
        authenticated: !!user,
        userObjectAvailable: !!userObj,
        selectedTierId: selectedTierId
      });
      
      // 1. Create Checkout Session on the backend
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { 'X-Session-ID': sessionId } : {}),
          ...(userId ? { 'X-User-ID': userId } : {}),
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ 
          ticketTierId: selectedTierId,
          quantity,
          userId: userObj?.id || userId, // Include userId in body as well for additional verification
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Special handling for authentication errors
        if (response.status === 401) {
          console.error('Authentication failed with status:', response.status, errorData);
          throw new Error('Authentication required. Please log in again.');
        }
        console.error('Checkout error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId: checkoutSessionId } = await response.json();

      // 2. Redirect to Stripe Checkout
      const stripe = await getStripe(); // Use the getter function
      if (!stripe) {
        throw new Error('Stripe.js failed to load or key is missing.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: checkoutSessionId,
      });

      if (stripeError) {
        console.error('Stripe redirection error:', stripeError);
        setError(stripeError.message || 'Failed to redirect to Stripe.');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white/60">
        <p className="text-red-500 mb-4">Error loading event details</p>
        <Button onClick={() => setLocation(`/event/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToEvent')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={() => setLocation(`/event/${id}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('backToEvent')}
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">{t('purchaseTickets')}</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {event.ticketTiers && event.ticketTiers.length > 0 && (
            <div className="mb-6">
              <Label className="mb-3 block">Select Ticket Tier</Label>
              <div className="space-y-3">
                {event.ticketTiers
                  .filter(tier => tier.isActive)
                  .map(tier => (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTierId === tier.id
                          ? 'border-white bg-white/5'
                          : 'border-gray-500/40 hover:border-gray-400'
                      }`}
                      data-testid={`ticket-tier-${tier.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{tier.name}</h3>
                          {tier.description && (
                            <p className="text-sm text-white/60 mt-1">{tier.description}</p>
                          )}
                          {tier.quantity && (
                            <p className="text-xs text-white/40 mt-1">
                              {tier.quantity} tickets available
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">${parseFloat(tier.price).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 mt-6">
            <div className="w-full max-w-xs">
              <Label htmlFor="quantity">{t('ticketQuantity')}</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={selectedTier?.quantity || 10}
                value={quantity}
                onChange={handleQuantityChange}
                className="mt-1"
                data-testid="input-quantity"
              />
              {selectedTier?.quantity && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTier.quantity} {t('ticketsAvailable')}
                </p>
              )}
            </div>
            {selectedTier && (
              <div className="text-right">
                <p className="text-lg font-semibold">
                  ${parseFloat(selectedTier.price).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">{t('perTicket')}</p>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between mb-2">
              <span>{t('subtotal')}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{t('serviceFee')}</span>
              <span>${fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span>{t('total')}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 w-full" role="alert">
              <span className="block sm:inline">{error}</span>
              {error.includes('Authentication required') && (
                <Button
                  variant="destructive"
                  className="mt-2 w-full"
                  onClick={() => setLocation('/auth')}
                >
                  {t('login')}
                </Button>
              )}
            </div>
          )}
          <Button
            className="w-full font-semibold"
            onClick={handlePurchase}
            disabled={isProcessing || !selectedTierId}
            data-testid="button-purchase"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              <>
                {t('proceedToPayment')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">All purchases are final. No refunds will be issued.</p>
        <p>{t('qrCodeTicket')}</p>
      </div>
    </div>
  );
} 