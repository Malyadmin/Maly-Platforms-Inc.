import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, DownloadIcon } from "lucide-react";
import { PaymentStats } from "@/components/admin/PaymentStats";
import { useUser } from "@/lib/useUser";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

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

export default function AdminPaymentsPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not an admin
    if (user && !user.isAdmin) {
      setLocation("/");
    }
  }, [user, setLocation]);

  useEffect(() => {
    const fetchAllPayments = async () => {
      try {
        setLoading(true);
        
        // Get session ID from localStorage
        const sessionId = localStorage.getItem('maly_session_id');
        
        const response = await fetch("/api/admin/all-payments", {
          headers: {
            'Content-Type': 'application/json',
            // Include session ID in headers if available
            ...(sessionId ? { 'x-session-id': sessionId } : {})
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("You do not have permission to access this data");
          }
          throw new Error("Failed to fetch payment data");
        }

        const data = await response.json();
        setAllPayments(data.payments || []);
      } catch (err) {
        console.error("Error fetching payment data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load payment data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllPayments();
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

  const handleExportCSV = () => {
    if (!allPayments.length) return;

    // Create CSV content
    const headers = [
      "ID",
      "Subscription ID",
      "User ID",
      "Amount",
      "Currency",
      "Status",
      "Billing Reason",
      "Period Start",
      "Period End",
      "Payment Method",
      "Created At",
    ];

    const csvContent = [
      headers.join(","),
      ...allPayments.map((payment) => [
        payment.id,
        payment.subscriptionId,
        payment.userId,
        payment.amount / 100,
        payment.currency,
        payment.status,
        payment.billingReason || "",
        payment.periodStart,
        payment.periodEnd,
        payment.paymentMethod || "",
        payment.createdAt,
      ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payment-data-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-white hover:bg-accent"
                onClick={() => setLocation("/admin")}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Payment Management</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Payment Statistics */}
            <PaymentStats />

            {/* Payment History */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">All Payments</h2>
                {allPayments.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleExportCSV}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Export CSV
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading payment data...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : allPayments.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-muted-foreground">No payment records found</p>
                </div>
              ) : (
                <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 text-sm">{payment.id}</td>
                            <td className="px-4 py-3 text-sm">{payment.userId}</td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(payment.createdAt)}
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
                              {payment.billingReason
                                ? payment.billingReason.replace(/_/g, " ")
                                : "N/A"}
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 