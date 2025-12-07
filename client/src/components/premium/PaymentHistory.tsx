import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Payment {
  id: number;
  subscriptionId: number;
  userId: number;
  stripeInvoiceId: string;
  stripePaymentIntentId: string | null;
  amount: number;
  currency: string;
  status: string;
  billingReason: string | null;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        
        // Get session ID from localStorage
        const sessionId = localStorage.getItem('maly_session_id');
        
        const response = await fetch("/api/me/payment-history", {
          headers: {
            'Content-Type': 'application/json',
            // Include session ID in headers if available
            ...(sessionId ? { 'x-session-id': sessionId } : {})
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch payment history");
        }

        const data = await response.json();
        setPayments(data.payments || []);
      } catch (err) {
        console.error("Error fetching payment history:", err);
        setError("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getBillingReason = (reason: string | null) => {
    if (!reason) return "Payment";

    switch (reason) {
      case "subscription_create":
        return "Initial subscription";
      case "subscription_cycle":
        return "Recurring payment";
      case "subscription_update":
        return "Subscription update";
      default:
        return reason.replace(/_/g, " ");
    }
  };

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

  if (payments.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No payment history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 text-sm">
                  {formatDate(payment.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {getBillingReason(payment.billingReason)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {formatCurrency(payment.amount, payment.currency)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === "succeeded"
                        ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                        : payment.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                        : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {payment.receiptUrl ? (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 