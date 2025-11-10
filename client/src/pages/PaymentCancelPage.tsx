import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';

const PaymentCancelPage: React.FC = () => {
  const [location] = useLocation();
  
  // Extract eventId from the URL if available
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('eventId');
  
  // Clean URL if it has parameters
  useEffect(() => {
    if (params.toString()) {
      const url = new URL(window.location.href);
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []);

  return (
    <div className="container mx-auto p-8 text-center max-w-md">
      <div className="border border-red-200 rounded-lg p-6 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          Your payment process was cancelled. No charges have been made to your account.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {eventId && (
            <Link href={`/event/${eventId}`}>
              <Button variant="outline" size="icon" aria-label="Back to event">
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Back to Event</span>
              </Button>
            </Link>
          )}
          
          <Link href="/">
            <Button className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage; 