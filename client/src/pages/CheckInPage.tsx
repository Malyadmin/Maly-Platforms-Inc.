import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  QrCode, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  MapPin,
  User,
  Camera,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';

interface CheckInEvent {
  id: number;
  title: string;
  image: string | null;
  date: string | null;
  location: string | null;
  city: string | null;
  totalAttendees: number;
  checkedInCount: number;
  isPast: boolean;
}

interface Attendee {
  participantId: number;
  ticketIdentifier: string | null;
  ticketQuantity: number;
  checkInStatus: boolean;
  checkedInAt: string | null;
  purchaseDate: string | null;
  user: {
    id: number;
    fullName: string | null;
    username: string;
    profileImage: string | null;
    email: string;
  } | null;
}

interface ValidateResponse {
  valid: boolean;
  alreadyCheckedIn: boolean;
  checkedInAt: string | null;
  participant: {
    id: number;
    ticketQuantity: number;
    ticketIdentifier: string;
  };
  event: {
    id: number;
    title: string;
    date: string | null;
    location: string | null;
  };
  attendee: {
    id: number;
    fullName: string | null;
    username: string;
    profileImage: string | null;
    email: string;
  } | null;
}

export default function CheckInPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'scan' | 'past'>('scan');
  const [selectedEvent, setSelectedEvent] = useState<CheckInEvent | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ValidateResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPastEventAttendees, setShowPastEventAttendees] = useState<number | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  const { data: eventsData, isLoading: eventsLoading } = useQuery<{
    upcomingEvents: CheckInEvent[];
    pastEvents: CheckInEvent[];
  }>({
    queryKey: ['/api/creator/check-in/events'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) headers['X-User-ID'] = user.id.toString();
      const res = await fetch('/api/creator/check-in/events', {
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
    enabled: !!user,
  });

  const { data: attendeesData, isLoading: attendeesLoading } = useQuery<{
    event: { id: number; title: string; date: string | null; location: string | null };
    attendees: Attendee[];
  }>({
    queryKey: ['/api/creator/check-in/events', showPastEventAttendees, 'attendees'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) headers['X-User-ID'] = user.id.toString();
      const res = await fetch(`/api/creator/check-in/events/${showPastEventAttendees}/attendees`, {
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch attendees');
      return res.json();
    },
    enabled: !!showPastEventAttendees && !!user,
  });

  const validateMutation = useMutation({
    mutationFn: async (ticketIdentifier: string) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.id) headers['X-User-ID'] = user.id.toString();
      const res = await fetch('/api/creator/check-in/validate', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ ticketIdentifier, eventId: selectedEvent?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to validate ticket');
      return data as ValidateResponse;
    },
    onSuccess: (data) => {
      setScannedData(data);
      stopScanner();
    },
    onError: (error: Error) => {
      toast({
        title: t('checkIn.invalidTicket'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (ticketIdentifier: string) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.id) headers['X-User-ID'] = user.id.toString();
      const res = await fetch('/api/creator/check-in/confirm', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ ticketIdentifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm check-in');
      return data;
    },
    onSuccess: () => {
      setShowConfirmDialog(false);
      toast({
        title: t('checkIn.success'),
        description: `${scannedData?.attendee?.fullName || scannedData?.attendee?.username} ${t('checkIn.checkedIn')}`,
      });
      setScannedData(null);
      queryClient.invalidateQueries({ queryKey: ['/api/creator/check-in/events'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('checkIn.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }
      
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          validateMutation.mutate(decodedText);
        },
        () => {}
      );
      
      setIsScanning(true);
    } catch (error) {
      console.error('Failed to start scanner:', error);
      toast({
        title: t('checkIn.cameraError'),
        description: t('checkIn.cameraPermission'),
        variant: 'destructive',
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.log('Scanner already stopped');
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleEventSelect = (event: CheckInEvent) => {
    setSelectedEvent(event);
    setScannedData(null);
  };

  const handleCheckIn = () => {
    setShowConfirmDialog(true);
  };

  const confirmCheckIn = () => {
    if (scannedData?.participant.ticketIdentifier) {
      confirmMutation.mutate(scannedData.participant.ticketIdentifier);
    }
  };

  const handleScanAnother = () => {
    setScannedData(null);
    startScanner();
  };

  const handleBack = () => {
    if (showPastEventAttendees) {
      setShowPastEventAttendees(null);
    } else if (scannedData) {
      setScannedData(null);
    } else if (selectedEvent) {
      stopScanner();
      setSelectedEvent(null);
    } else {
      setLocation('/creator/dashboard');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-black">
      <div className="sticky top-0 z-50 bg-background dark:bg-black border-b border-border">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
          <HamburgerMenu />
        </div>
        
        <div className="px-5 pb-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1 text-foreground hover:bg-foreground/10 rounded-full transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-foreground text-lg font-medium uppercase" style={{ letterSpacing: '0.2em' }}>
            {showPastEventAttendees ? t('checkIn.attendeeList') : 
             selectedEvent ? selectedEvent.title : t('checkIn.title')}
          </h2>
        </div>
      </div>

      <div className="px-4 py-6">
        {!selectedEvent && !showPastEventAttendees && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'scan' | 'past')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted mb-6">
              <TabsTrigger 
                value="scan" 
                className="text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground"
                data-testid="tab-scan"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {t('checkIn.scanTickets')}
              </TabsTrigger>
              <TabsTrigger 
                value="past"
                className="text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground"
                data-testid="tab-past"
              >
                <History className="w-4 h-4 mr-2" />
                {t('checkIn.pastEvents')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="mt-0">
              {eventsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : eventsData?.upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('checkIn.noUpcomingEvents')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm mb-4">{t('checkIn.selectEvent')}</p>
                  {eventsData?.upcomingEvents.map((event) => (
                    <Card 
                      key={event.id}
                      className="bg-card border-border cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleEventSelect(event)}
                      data-testid={`card-event-${event.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {event.image ? (
                              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                            {event.date && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.date), 'MMM d, yyyy')}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {event.totalAttendees} {t('checkIn.total')}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {event.checkedInCount} {t('checkIn.checkedInLabel')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              {eventsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : eventsData?.pastEvents.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('checkIn.noPastEvents')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventsData?.pastEvents.map((event) => (
                    <Card 
                      key={event.id}
                      className="bg-card border-border cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setShowPastEventAttendees(event.id)}
                      data-testid={`card-past-event-${event.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {event.image ? (
                              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                            {event.date && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.date), 'MMM d, yyyy')}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {event.checkedInCount}/{event.totalAttendees} {t('checkIn.attended')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {selectedEvent && !scannedData && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm">
                {t('checkIn.scanningFor')} <span className="text-foreground font-medium">{selectedEvent.title}</span>
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                {selectedEvent.checkedInCount}/{selectedEvent.totalAttendees} {t('checkIn.checkedInLabel')}
              </p>
            </div>

            <div 
              id={scannerContainerId}
              className="w-full max-w-sm mx-auto aspect-square bg-muted rounded-xl overflow-hidden"
            />

            {!isScanning && (
              <Button
                onClick={startScanner}
                className="w-full bg-white hover:bg-gray-100 text-black text-white font-semibold py-6 text-lg"
                data-testid="button-start-scan"
              >
                <Camera className="w-5 h-5 mr-2" />
                {t('checkIn.startScanning')}
              </Button>
            )}

            {isScanning && (
              <Button
                onClick={stopScanner}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
                data-testid="button-stop-scan"
              >
                {t('checkIn.stopScanning')}
              </Button>
            )}
          </div>
        )}

        {scannedData && (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-24 h-24 mb-4 border-2 border-border">
                    <AvatarImage src={scannedData.attendee?.profileImage || undefined} />
                    <AvatarFallback className="bg-muted text-foreground text-2xl">
                      {scannedData.attendee?.fullName?.charAt(0) || scannedData.attendee?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {scannedData.attendee?.fullName || scannedData.attendee?.username || 'Unknown'}
                  </h2>
                  
                  {scannedData.attendee?.email && (
                    <p className="text-muted-foreground text-sm mb-4">{scannedData.attendee.email}</p>
                  )}

                  <div className="w-full space-y-3 mt-4">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">{t('checkIn.event')}</span>
                      <span className="text-foreground font-medium">{scannedData.event.title}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">{t('checkIn.tickets')}</span>
                      <span className="text-foreground font-medium">{scannedData.participant.ticketQuantity}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">{t('checkIn.status')}</span>
                      {scannedData.alreadyCheckedIn ? (
                        <span className="text-yellow-500 dark:text-yellow-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('checkIn.alreadyCheckedIn')}
                        </span>
                      ) : (
                        <span className="text-foreground flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {t('checkIn.readyToCheckIn')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!scannedData.alreadyCheckedIn ? (
              <Button
                onClick={handleCheckIn}
                className="w-full bg-white hover:bg-gray-100 text-black text-white font-semibold py-6 text-lg"
                disabled={confirmMutation.isPending}
                data-testid="button-check-in"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {t('checkIn.confirmCheckIn')}
              </Button>
            ) : (
              <Button
                onClick={handleScanAnother}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
                data-testid="button-scan-another"
              >
                <QrCode className="w-5 h-5 mr-2" />
                {t('checkIn.scanAnother')}
              </Button>
            )}

            <Button
              onClick={handleScanAnother}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
              data-testid="button-scan-new"
            >
              {t('checkIn.scanNewTicket')}
            </Button>
          </div>
        )}

        {showPastEventAttendees && (
          <div className="space-y-4">
            {attendeesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : attendeesData?.attendees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('checkIn.noAttendees')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground text-sm">
                    {attendeesData?.attendees.filter(a => a.checkInStatus).length}/{attendeesData?.attendees.length} {t('checkIn.attendedEvent')}
                  </p>
                </div>
                {attendeesData?.attendees.map((attendee) => (
                  <Card 
                    key={attendee.participantId}
                    className="bg-card border-border"
                    data-testid={`card-attendee-${attendee.participantId}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={attendee.user?.profileImage || undefined} />
                          <AvatarFallback className="bg-muted text-foreground">
                            {attendee.user?.fullName?.charAt(0) || attendee.user?.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {attendee.user?.fullName || attendee.user?.username || 'Unknown'}
                          </h3>
                          {attendee.checkedInAt && (
                            <p className="text-xs text-muted-foreground">
                              {t('checkIn.checkedInAt')} {format(new Date(attendee.checkedInAt), 'h:mm a')}
                            </p>
                          )}
                        </div>
                        {attendee.checkInStatus ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('checkIn.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('checkIn.confirmMessage').replace('{name}', scannedData?.attendee?.fullName || scannedData?.attendee?.username || 'this attendee')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted/80">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCheckIn}
              className="bg-white text-black text-white"
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? t('common.loading') : t('checkIn.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
