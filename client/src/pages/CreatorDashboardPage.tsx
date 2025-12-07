import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/ui/bottom-nav';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { IOSEventCard } from '@/components/ui/ios-event-card';
import { UserListModal } from '@/components/UserListModal';
import { useTranslation } from '@/lib/translations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserCheck, 
  Eye, 
  ChevronRight,
  Check,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardEvent {
  id: number;
  title: string;
  image: string | null;
  date: string;
  location: string | null;
  city: string | null;
  price: string | null;
  ticketType: string | null;
  isRsvp: boolean | null;
  requireApproval: boolean | null;
  ticketTiers?: { id: number; name: string; price: string }[];
  analytics?: {
    interestedCount: number;
    attendingCount: number;
    pendingCount: number;
    totalViews: number;
    ticketsSold: number;
    grossRevenue: number;
    platformFee: number;
    netRevenue: number;
  };
  ticketSales?: TicketSale[];
}

interface SalesSummary {
  totalRevenue: number;
  totalTicketsSold: number;
  totalPlatformFees: number;
  totalNetRevenue: number;
}

interface TicketSale {
  id: number;
  buyerName: string;
  buyerEmail: string;
  buyerImage: string | null;
  ticketQuantity: number;
  amount: number;
  currency: string;
  purchaseDate: string;
  status: string;
}

interface PendingRSVP {
  id: number;
  eventId: number;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  userName: string;
  userImage: string | null;
  userEmail: string;
  eventTitle: string;
  eventImage: string | null;
}

interface RSVPConfirmation {
  isOpen: boolean;
  type: 'accept' | 'decline' | null;
  userName: string;
  eventId: number;
  userId: number;
}

export default function CreatorDashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<'events' | 'analytics' | 'sales' | 'rsvps'>('events');
  const [rsvpSection, setRsvpSection] = useState<'pending' | 'completed'>('pending');
  const [confirmDialog, setConfirmDialog] = useState<RSVPConfirmation>({
    isOpen: false,
    type: null,
    userName: '',
    eventId: 0,
    userId: 0,
  });
  const [userListModal, setUserListModal] = useState<{
    isOpen: boolean;
    eventId: number | null;
    type: 'attending' | 'interested' | 'views';
    count: number;
  }>({
    isOpen: false,
    eventId: null,
    type: 'attending',
    count: 0,
  });

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<{
    events: DashboardEvent[];
    pendingRSVPs: PendingRSVP[];
    totalEvents: number;
    totalPendingRSVPs: number;
    salesSummary?: SalesSummary;
  }>({
    queryKey: ['/api/creator/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/creator/dashboard', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch RSVP applications (pending and completed)
  const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError } = useQuery<{
    pending: PendingRSVP[];
    completed: PendingRSVP[];
    totalPending: number;
    totalCompleted: number;
  }>({
    queryKey: ['/api/events/applications'],
    queryFn: async () => {
      const response = await fetch('/api/events/applications', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      return response.json();
    },
    enabled: !!user?.id,
  });

  console.log('[CREATOR_DASHBOARD] User state:', { user, userId: user?.id, isEnabled: !!user?.id });
  console.log('[CREATOR_DASHBOARD] Query state:', { isLoading, error: error?.toString(), hasData: !!data, errorMessage: error instanceof Error ? error.message : null });

  // Handle RSVP approval/rejection
  const handleRSVPMutation = useMutation({
    mutationFn: async ({ eventId, userId, action }: { eventId: number; userId: number; action: 'approved' | 'rejected' }) => {
      const response = await fetch(`/api/events/${eventId}/applications/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update RSVP request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/applications'] });
      setConfirmDialog({ isOpen: false, type: null, userName: '', eventId: 0, userId: 0 });
    },
  });


  const renderAnalyticsSection = (event: DashboardEvent) => (
    <div key={event.id} className="bg-card/50 rounded-lg p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
          {event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <Calendar className="h-6 w-6 text-gray-500" />
          )}
        </div>
        <div>
          <p className="text-foreground font-medium text-sm">{event.title}</p>
          <p className="text-muted-foreground text-xs">
            {event.date ? format(new Date(event.date), 'MMM d, yyyy') : t('dateTbd')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <button
          className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors cursor-pointer text-left"
          onClick={() => setUserListModal({
            isOpen: true,
            eventId: event.id,
            type: 'views',
            count: event.analytics?.totalViews || 0,
          })}
          data-testid={`views-button-${event.id}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">{t('views')}</span>
          </div>
          <p className="text-foreground text-xl font-semibold">{event.analytics?.totalViews || 0}</p>
        </button>
        
        <button
          className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors cursor-pointer text-left"
          onClick={() => setUserListModal({
            isOpen: true,
            eventId: event.id,
            type: 'attending',
            count: event.analytics?.attendingCount || 0,
          })}
          data-testid={`attending-button-${event.id}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-green-400" />
            <span className="text-xs text-muted-foreground">{t('attending')}</span>
          </div>
          <p className="text-foreground text-xl font-semibold">{event.analytics?.attendingCount || 0}</p>
        </button>
        
        <button
          className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors cursor-pointer text-left"
          onClick={() => setUserListModal({
            isOpen: true,
            eventId: event.id,
            type: 'interested',
            count: event.analytics?.interestedCount || 0,
          })}
          data-testid={`interested-button-${event.id}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-foreground" />
            <span className="text-xs text-muted-foreground">{t('interested')}</span>
          </div>
          <p className="text-foreground text-xl font-semibold">{event.analytics?.interestedCount || 0}</p>
        </button>
      </div>
    </div>
  );

  const renderTicketSale = (sale: TicketSale) => (
    <div key={sale.id} className="flex items-center gap-3 p-3 bg-card/50 rounded-lg">
      <Avatar className="h-10 w-10">
        <AvatarImage src={sale.buyerImage || undefined} />
        <AvatarFallback>{sale.buyerName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-foreground text-sm font-medium">{sale.buyerName}</p>
        <p className="text-muted-foreground text-xs">
          {sale.ticketQuantity} ticket{sale.ticketQuantity > 1 ? 's' : ''} • {sale.purchaseDate ? format(new Date(sale.purchaseDate), 'MMM d, yyyy') : 'N/A'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-foreground font-semibold">${(sale.amount / 100).toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{sale.status}</p>
      </div>
    </div>
  );

  const renderPendingRSVP = (rsvp: PendingRSVP) => (
    <div key={rsvp.id} className="bg-card/50 rounded-lg p-4" data-testid={`pending-rsvp-${rsvp.id}`}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={rsvp.userImage || undefined} />
          <AvatarFallback>{(rsvp.userName?.[0] ?? '?').toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-foreground font-medium text-sm" data-testid={`rsvp-user-name-${rsvp.id}`}>{rsvp.userName || 'Unknown User'}</p>
          <p className="text-muted-foreground text-xs">{rsvp.userEmail || 'No email'}</p>
          <p className="text-foreground text-xs mt-1" data-testid={`rsvp-event-title-${rsvp.id}`}>{rsvp.eventTitle || 'Unknown Event'}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={() => setConfirmDialog({
            isOpen: true,
            type: 'accept',
            userName: rsvp.userName,
            eventId: rsvp.eventId,
            userId: rsvp.userId,
          })}
          disabled={handleRSVPMutation.isPending}
          className="flex-1 bg-green-600 hover:bg-green-700 text-foreground"
          size="sm"
          data-testid={`approve-rsvp-${rsvp.id}`}
        >
          <Check className="h-4 w-4 mr-1" />
          {t('accept')}
        </Button>
        <Button
          onClick={() => setConfirmDialog({
            isOpen: true,
            type: 'decline',
            userName: rsvp.userName,
            eventId: rsvp.eventId,
            userId: rsvp.userId,
          })}
          disabled={handleRSVPMutation.isPending}
          className="flex-1 bg-red-600 hover:bg-red-700 text-foreground"
          size="sm"
          data-testid={`decline-rsvp-${rsvp.id}`}
        >
          <X className="h-4 w-4 mr-1" />
          {t('decline')}
        </Button>
      </div>
    </div>
  );

  const renderCompletedRSVP = (rsvp: PendingRSVP) => {
    const isApproved = rsvp.status === 'attending' || rsvp.status === 'interested';
    const statusText = isApproved ? t('accepted') : t('declined');
    const statusColor = isApproved ? 'text-green-400' : 'text-red-400';
    const StatusIcon = isApproved ? CheckCircle2 : XCircle;

    return (
      <div key={rsvp.id} className="bg-card/50 rounded-lg p-4" data-testid={`completed-rsvp-${rsvp.id}`}>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={rsvp.userImage || undefined} />
            <AvatarFallback>{(rsvp.userName?.[0] ?? '?').toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-foreground font-medium text-sm" data-testid={`completed-rsvp-user-${rsvp.id}`}>{rsvp.userName || 'Unknown User'}</p>
            <p className="text-muted-foreground text-xs">{rsvp.userEmail || 'No email'}</p>
            <p className="text-foreground text-xs mt-1">{rsvp.eventTitle || 'Unknown Event'}</p>
            <p className="text-gray-500 text-xs mt-1">
              {rsvp.updatedAt ? format(new Date(rsvp.updatedAt), 'MMM d, yyyy') : ''}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="text-sm font-medium" data-testid={`completed-rsvp-status-${rsvp.id}`}>{statusText}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="h-screen bg-background dark:bg-black text-foreground flex flex-col items-center justify-center gap-4">
        <p>{t('pleaseLoginToViewDashboard')}</p>
        <Button onClick={() => setLocation('/auth')} className="bg-white hover:bg-gray-100 text-black">
          {t('goToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background dark:bg-black text-foreground">
      {/* Header - Fixed at top */}
      <header className="bg-background dark:bg-black text-foreground shrink-0 z-50">
        {/* Top bar with MÁLY logo and hamburger menu */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
          <HamburgerMenu />
        </div>
        
        {/* Dashboard title with gradient */}
        <div className="px-5 pb-3">
          <h2 className="text-foreground text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
            {t('dashboardSpaced')}
          </h2>
        </div>

        {/* Filter Bar */}
        <div className="bg-background dark:bg-black border-b border-border">
          <div className="px-5 py-3 flex items-center justify-between gap-4">
            <button
              onClick={() => setActiveFilter('events')}
              className={`text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeFilter === 'events' 
                  ? 'text-foreground font-medium' 
                  : 'text-foreground hover:text-foreground'
              }`}
              data-testid="filter-events"
            >
              {t('myEvents')}
            </button>
            <button
              onClick={() => setActiveFilter('analytics')}
              className={`text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeFilter === 'analytics' 
                  ? 'text-foreground font-medium' 
                  : 'text-foreground hover:text-foreground'
              }`}
              data-testid="filter-analytics"
            >
              {t('analytics')}
            </button>
            <button
              onClick={() => setActiveFilter('sales')}
              className={`text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeFilter === 'sales' 
                  ? 'text-foreground font-medium' 
                  : 'text-foreground hover:text-foreground'
              }`}
              data-testid="filter-sales"
            >
              {t('ticketSales')}
            </button>
            <button
              onClick={() => setActiveFilter('rsvps')}
              className={`text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeFilter === 'rsvps' 
                  ? 'text-foreground font-medium' 
                  : 'text-foreground hover:text-foreground'
              }`}
              data-testid="filter-rsvps"
            >
              {t('rsvps')}
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full bg-gray-700 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 font-medium">{t('failedToLoadDashboard')}</p>
              <p className="text-red-300 text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
              <p className="text-muted-foreground text-xs mt-2">User ID: {user?.id || 'Not found'}</p>
            </div>
          </div>
        ) : (
          <div className="pb-20 px-4">
            {/* My Events Filter */}
            {activeFilter === 'events' && (
              <div>
                {!data?.events || data.events.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">{t('noEventsCreatedYet')}</p>
                    <Button
                      onClick={() => setLocation('/create-event')}
                      className="mt-4 bg-white hover:bg-gray-100 text-black"
                    >
                      {t('createYourFirstEvent')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {data.events.map((event) => (
                      <IOSEventCard 
                        key={event.id} 
                        event={{
                          id: event.id,
                          title: event.title,
                          date: event.date,
                          location: event.location ?? undefined,
                          price: event.price ?? undefined,
                          image: event.image ?? undefined,
                          interestedCount: event.analytics?.interestedCount || 0,
                          isRsvp: event.isRsvp ?? undefined,
                          requireApproval: event.requireApproval ?? undefined,
                          ticketType: event.ticketType ?? undefined,
                          ticketTiers: event.ticketTiers
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Filter */}
            {activeFilter === 'analytics' && (
              <div>
                {!data?.events || data.events.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">{t('noAnalyticsAvailable')}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {data.events.map(renderAnalyticsSection)}
                  </div>
                )}
              </div>
            )}

            {/* Ticket Sales Filter */}
            {activeFilter === 'sales' && (
              <div>
                {/* Sales Summary Header */}
                {data?.salesSummary && data.salesSummary.totalTicketsSold > 0 && (
                  <div className="mt-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('totalRevenue')}</p>
                        <p className="text-xl font-bold text-foreground">${data.salesSummary.totalRevenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('ticketsSold')}</p>
                        <p className="text-xl font-bold text-foreground">{data.salesSummary.totalTicketsSold}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('platformFee')}</p>
                        <p className="text-sm text-muted-foreground">-${data.salesSummary.totalPlatformFees.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('yourEarnings')}</p>
                        <p className="text-lg font-semibold text-foreground">${data.salesSummary.totalNetRevenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Per-Event Sales Breakdown */}
                {!data?.events || data.events.every(e => (e.analytics?.ticketsSold || 0) === 0) ? (
                  <div className="py-8 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">{t('noTicketSalesYet')}</p>
                    <p className="text-muted-foreground text-xs mt-1">{t('salesWillAppear')}</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {data.events.filter(e => (e.analytics?.ticketsSold || 0) > 0).map(event => (
                      <div key={event.id} className="bg-card/50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                            {event.image ? (
                              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                              <Calendar className="h-6 w-6 text-gray-500 m-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium text-sm">{event.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {event.date ? format(new Date(event.date), 'MMM d, yyyy') : t('dateTbd')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-gray-800/50 rounded-lg p-2">
                            <p className="text-lg font-semibold text-foreground">{event.analytics?.ticketsSold || 0}</p>
                            <p className="text-xs text-muted-foreground">{t('tickets')}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-2">
                            <p className="text-lg font-semibold text-white">${(event.analytics?.grossRevenue || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{t('revenue')}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-2">
                            <p className="text-lg font-semibold text-white">${(event.analytics?.netRevenue || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{t('earnings')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RSVPs Filter */}
            {activeFilter === 'rsvps' && (
              <div>
                {applicationsError ? (
                  <div className="p-4">
                    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                      <p className="text-red-400 font-medium">{t('failedToLoadRsvpApplications')}</p>
                      <p className="text-red-300 text-sm mt-2">{applicationsError instanceof Error ? applicationsError.message : 'Unknown error'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Pending/Completed Toggle */}
                    <div className="flex justify-between mb-6 mt-4 border-b border-border">
                      <button
                        onClick={() => setRsvpSection('pending')}
                        className={`pb-3 transition-all ${
                          rsvpSection === 'pending'
                            ? 'text-foreground border-b-2 border-foreground'
                            : 'text-muted-foreground hover:text-gray-300'
                        }`}
                        data-testid="tab-pending-rsvps"
                      >
                        {t('pending')} ({applicationsData?.totalPending || 0})
                      </button>
                      <button
                        onClick={() => setRsvpSection('completed')}
                        className={`pb-3 transition-all ${
                          rsvpSection === 'completed'
                            ? 'text-foreground border-b-2 border-foreground'
                            : 'text-muted-foreground hover:text-gray-300'
                        }`}
                        data-testid="tab-completed-rsvps"
                      >
                        {t('completed')} ({applicationsData?.totalCompleted || 0})
                      </button>
                    </div>

                    {applicationsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24 w-full bg-gray-700 rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <>
                        {/* Pending Section */}
                        {rsvpSection === 'pending' && (
                          <div>
                            {!applicationsData?.pending || applicationsData.pending.length === 0 ? (
                              <div className="py-8 text-center">
                                <p className="text-muted-foreground text-sm">{t('noPendingRsvpRequests')}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {applicationsData.pending.map(renderPendingRSVP)}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Completed Section */}
                        {rsvpSection === 'completed' && (
                          <div>
                            {!applicationsData?.completed || applicationsData.completed.length === 0 ? (
                              <div className="py-8 text-center">
                                <p className="text-muted-foreground text-sm">{t('noCompletedRsvpRequests')}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {applicationsData.completed.map(renderCompletedRSVP)}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />

      {/* User List Modal */}
      {userListModal.eventId && (
        <UserListModal
          isOpen={userListModal.isOpen}
          onClose={() => setUserListModal({ ...userListModal, isOpen: false })}
          eventId={userListModal.eventId}
          type={userListModal.type}
          count={userListModal.count}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setConfirmDialog({ isOpen: false, type: null, userName: '', eventId: 0, userId: 0 });
        }
      }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {confirmDialog.type === 'accept' ? t('acceptRsvpRequest') : t('declineRsvpRequest')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmDialog.type === 'accept' 
                ? t('confirmAcceptRsvp')
                : t('confirmDeclineRsvp')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-800 text-foreground hover:bg-gray-700"
              data-testid="confirm-dialog-cancel"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.type) {
                  handleRSVPMutation.mutate({
                    eventId: confirmDialog.eventId,
                    userId: confirmDialog.userId,
                    action: confirmDialog.type === 'accept' ? 'approved' : 'rejected',
                  });
                }
              }}
              className={confirmDialog.type === 'accept' 
                ? 'bg-green-600 hover:bg-green-700 text-foreground'
                : 'bg-red-600 hover:bg-red-700 text-foreground'
              }
              data-testid="confirm-dialog-confirm"
            >
              {confirmDialog.type === 'accept' ? t('yesAccept') : t('yesDecline')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
