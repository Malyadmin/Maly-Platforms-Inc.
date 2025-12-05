import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { ChevronLeft, Camera, CameraOff, CheckCircle, XCircle, AlertCircle, Users, QrCode } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/translations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VerifyResult {
  valid: boolean;
  alreadyCheckedIn?: boolean;
  checkedInAt?: string;
  message?: string;
  error?: string;
  attendee?: {
    name: string;
    profileImage?: string;
  };
  event?: {
    id: number;
    title: string;
  };
  ticketInfo?: {
    tier: string;
    quantity: number;
    participantId?: number;
  };
}

export default function QRScannerPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<VerifyResult | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: userEvents } = useQuery({
    queryKey: ['/api/events/my-events'],
    enabled: !!user,
  });

  const verifyMutation = useMutation({
    mutationFn: async (ticketIdentifier: string) => {
      const response = await apiRequest('/api/tickets/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          ticketIdentifier,
          eventId: selectedEventId || undefined 
        }),
      });
      return response as VerifyResult;
    },
    onSuccess: (data) => {
      setScanResult(data);
      stopScanning();
    },
    onError: (error: any) => {
      setScanResult({
        valid: false,
        error: error.message || 'Failed to verify ticket',
      });
      stopScanning();
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (participantId: number) => {
      return apiRequest(`/api/tickets/${participantId}/check-in`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('ticketCheckedIn'),
      });
      setScanResult(null);
      if (selectedEventId) {
        queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventId, 'attendees'] });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t('error'),
        description: error.message || t('checkInFailed'),
      });
    },
  });

  const startScanning = async () => {
    if (scannerRef.current) {
      await stopScanning();
    }

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          verifyMutation.mutate(decodedText);
        },
        () => {}
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('cameraAccessDenied'),
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleCheckIn = () => {
    if (scanResult?.ticketInfo?.participantId) {
      checkInMutation.mutate(scanResult.ticketInfo.participantId);
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    startScanning();
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{t('pleaseSignIn')}</p>
            <Button onClick={() => setLocation('/auth')} className="mt-4">
              {t('signIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-background sticky top-0 z-50">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/creator-dashboard')}
                className="flex items-center text-foreground"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
                {t('scannerSpaced')}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('selectEvent')} ({t('optional')})
              </label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="bg-muted border-border" data-testid="select-event">
                  <SelectValue placeholder={t('allEvents')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('allEvents')}</SelectItem>
                  {userEvents?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {t('filterByEventHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {!scanResult && (
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              <div 
                id="qr-reader" 
                ref={scannerContainerRef}
                className="w-full aspect-square bg-black"
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              
              {!isScanning && (
                <div className="w-full aspect-square bg-muted flex flex-col items-center justify-center">
                  <QrCode className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center px-4">
                    {t('tapToStartScanning')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!scanResult && (
          <Button
            onClick={isScanning ? stopScanning : startScanning}
            className={`w-full ${isScanning ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
            size="lg"
            data-testid="button-toggle-scanner"
          >
            {isScanning ? (
              <>
                <CameraOff className="w-5 h-5 mr-2" />
                {t('stopScanning')}
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                {t('startScanning')}
              </>
            )}
          </Button>
        )}

        {scanResult && (
          <Card className={`border-2 ${
            scanResult.valid 
              ? scanResult.alreadyCheckedIn 
                ? 'border-yellow-500 bg-yellow-500/10' 
                : 'border-green-500 bg-green-500/10'
              : 'border-red-500 bg-red-500/10'
          }`}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {scanResult.valid ? (
                  scanResult.alreadyCheckedIn ? (
                    <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                  ) : (
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  )
                ) : (
                  <XCircle className="w-16 h-16 text-red-500 mb-4" />
                )}
                
                <h3 className={`text-xl font-semibold mb-2 ${
                  scanResult.valid 
                    ? scanResult.alreadyCheckedIn 
                      ? 'text-yellow-500' 
                      : 'text-green-500'
                    : 'text-red-500'
                }`}>
                  {scanResult.valid 
                    ? scanResult.alreadyCheckedIn 
                      ? t('alreadyCheckedIn')
                      : t('validTicket')
                    : t('invalidTicket')
                  }
                </h3>
                
                {scanResult.message && (
                  <p className="text-muted-foreground mb-4">{scanResult.message}</p>
                )}
                
                {scanResult.error && !scanResult.valid && (
                  <p className="text-muted-foreground mb-4">{scanResult.error}</p>
                )}
                
                {scanResult.attendee && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={scanResult.attendee.profileImage} />
                      <AvatarFallback>
                        {scanResult.attendee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{scanResult.attendee.name}</p>
                      {scanResult.ticketInfo && (
                        <p className="text-sm text-muted-foreground">
                          {scanResult.ticketInfo.tier} • {scanResult.ticketInfo.quantity} {t('ticket')}{scanResult.ticketInfo.quantity > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {scanResult.event && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('event')}: {scanResult.event.title}
                  </p>
                )}
                
                {scanResult.alreadyCheckedIn && scanResult.checkedInAt && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('checkedInAt')}: {new Date(scanResult.checkedInAt).toLocaleString()}
                  </p>
                )}
                
                <div className="flex gap-3 w-full mt-2">
                  {scanResult.valid && !scanResult.alreadyCheckedIn && scanResult.ticketInfo?.participantId && (
                    <Button
                      onClick={handleCheckIn}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={checkInMutation.isPending}
                      data-testid="button-confirm-checkin"
                    >
                      {checkInMutation.isPending ? t('processing') : t('confirmCheckIn')}
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleScanAgain}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-scan-again"
                  >
                    {t('scanAnother')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedEventId && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation(`/creator-dashboard/attendees/${selectedEventId}`)}
            data-testid="button-view-attendees"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('viewAttendeeList')}
          </Button>
        )}
      </div>
    </div>
  );
}
