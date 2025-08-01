import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ConnectAccountStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export function useStripeConnect() {
  const [status, setStatus] = useState<ConnectAccountStatus | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/stripe/connect/account-status'],
    queryFn: async (): Promise<ConnectAccountStatus> => {
      const response = await fetch('/api/stripe/connect/account-status', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch account status');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  useEffect(() => {
    if (data) {
      setStatus(data);
    }
  }, [data]);

  const createAccount = async () => {
    const response = await fetch('/api/stripe/connect/create-account', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create account');
    }

    return response.json();
  };

  const createAccountLink = async () => {
    const response = await fetch('/api/stripe/connect/create-account-link', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create account link');
    }

    return response.json();
  };

  const refreshStatus = () => {
    refetch();
  };

  return {
    status: status || data,
    isLoading,
    error,
    createAccount,
    createAccountLink,
    refreshStatus,
    canReceivePayments: status?.onboardingComplete || false,
  };
}