import React, { useState, useEffect } from "react";
import { Loader2, CreditCard, Users, TrendingUp } from "lucide-react";

interface PaymentStats {
  recentPaymentsCount: number;
  totalRevenue: number;
  activeSubscriptionsCount: number;
  premiumUsersCount: number;
}

export function PaymentStats() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentStats = async () => {
      try {
        setLoading(true);
        
        // Get session ID from localStorage
        const sessionId = localStorage.getItem('maly_session_id');
        
        const response = await fetch("/api/admin/payment-stats", {
          headers: {
            'Content-Type': 'application/json',
            // Include session ID in headers if available
            ...(sessionId ? { 'x-session-id': sessionId } : {})
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("You do not have permission to view this data");
          }
          throw new Error("Failed to fetch payment statistics");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching payment stats:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load payment statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payment Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue (30 days)</p>
              <h3 className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(stats.totalRevenue)}
              </h3>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Recent Payments Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent Payments (30 days)</p>
              <h3 className="text-2xl font-bold mt-1">{stats.recentPaymentsCount}</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Subscriptions Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <h3 className="text-2xl font-bold mt-1">{stats.activeSubscriptionsCount}</h3>
            </div>
            <div className="bg-gray-200 dark:bg-gray-800/50 p-2 rounded-full">
              <CreditCard className="w-5 h-5 text-foreground dark:text-foreground" />
            </div>
          </div>
        </div>

        {/* Premium Users Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Premium Users</p>
              <h3 className="text-2xl font-bold mt-1">{stats.premiumUsersCount}</h3>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 