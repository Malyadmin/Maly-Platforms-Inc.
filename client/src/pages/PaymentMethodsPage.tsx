import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/ui/bottom-nav';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { CreditCard, Shield, Receipt, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentHistory {
  id: number;
  eventTitle: string;
  amount: number;
  currency: string;
  status: string;
  purchaseDate: string;
  ticketQuantity: number;
}

export default function PaymentMethodsPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();

  // Fetch payment history
  const { data: payments, isLoading } = useQuery<PaymentHistory[]>({
    queryKey: ['/api/user/payment-history'],
    queryFn: async () => {
      const response = await fetch('/api/user/payment-history', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <p>Please log in to view payment methods</p>
        <Button onClick={() => setLocation('/auth')} className="bg-purple-600 hover:bg-purple-700">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* Header - Fixed at top */}
      <header className="bg-background text-foreground shrink-0 z-50 border-b border-gray-800">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
          <HamburgerMenu />
        </div>
        
        <div className="px-5 pb-3">
          <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
            P A Y M E N T S
          </h2>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-20 px-5">
        {/* How Payments Work Section */}
        <div className="mt-6">
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-purple-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-foreground font-semibold text-lg mb-2">Secure Payments</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  All payments on Maly are processed securely through Stripe. 
                  When you purchase tickets, you'll enter your card information at checkout. 
                  We don't store your payment details - everything is handled safely by Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* No Saved Cards Message */}
        <div className="mt-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <CreditCard className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />
              <div>
                <h3 className="text-foreground font-medium mb-2">No Saved Payment Methods</h3>
                <p className="text-muted-foreground text-sm">
                  For your security, payment information is entered fresh each time you purchase tickets. 
                  This ensures your card details are never stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-purple-400" />
            <h3 className="text-foreground font-semibold text-lg">Recent Purchases</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No purchases yet</p>
              <p className="text-gray-500 text-xs mt-2">Your ticket purchases will appear here</p>
              <Button
                onClick={() => setLocation('/events')}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                Browse Events
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                  data-testid={`payment-${payment.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-foreground font-medium text-sm mb-1">
                        {payment.eventTitle}
                      </p>
                      <p className="text-muted-foreground text-xs mb-2">
                        {payment.ticketQuantity} ticket{payment.ticketQuantity > 1 ? 's' : ''} • {
                          payment.purchaseDate ? format(new Date(payment.purchaseDate), 'MMM d, yyyy') : 'N/A'
                        }
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          payment.status === 'succeeded' || payment.status === 'paid'
                            ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                            : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {payment.status === 'succeeded' || payment.status === 'paid' ? 'Paid' : payment.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground font-semibold">
                        ${(payment.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-gray-500 text-xs">{payment.currency.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 mb-6">
          <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Need help with a payment?</strong>
              <br />
              Contact support for refunds or payment issues. All transactions are protected by Stripe's secure payment processing.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
