import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { ChevronLeft, QrCode, Download, Calendar, MapPin, CheckCircle, Clock } from "lucide-react";
import { useTranslation } from "@/lib/translations";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import QRCode from "qrcode";
import { BottomNav } from "@/components/ui/bottom-nav";

interface Ticket {
  id: number;
  eventId: number;
  ticketTierId: number;
  status: string;
  ticketQuantity: number;
  purchaseDate: string;
  paymentStatus: string;
  ticketIdentifier: string;
  checkInStatus: boolean;
  checkedInAt: string | null;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  tierName: string;
}

export default function MyQRCodesPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, isLoading: userLoading } = useUser();
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<number, string>>({});

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/me/tickets'],
    enabled: !!user,
  });

  const generateQRCode = async (ticketId: number, ticketIdentifier: string) => {
    if (qrCodeUrls[ticketId]) return;
    
    try {
      const url = await QRCode.toDataURL(ticketIdentifier, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        scale: 6,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrls(prev => ({ ...prev, [ticketId]: url }));
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleExpandTicket = (ticket: Ticket) => {
    if (expandedTicket === ticket.id) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticket.id);
      generateQRCode(ticket.id, ticket.ticketIdentifier);
    }
  };

  const downloadQRCode = async (ticket: Ticket) => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/qr`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to download QR code');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.eventTitle.replace(/\s+/g, '-')}-${ticket.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const isLoading = userLoading || ticketsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="border-b border-border bg-background sticky top-0 z-50">
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <img 
              src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
              alt="MÁLY" 
              className="h-14 w-auto logo-adaptive"
            />
          </div>
          <div className="px-5 pb-3">
            <div className="flex items-center gap-4">
              <ChevronLeft className="w-6 h-6" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{t('pleaseSignIn')}</p>
            <Button onClick={() => setLocation('/auth')} className="mt-4">
              {t('signIn')}
            </Button>
          </CardContent>
        </Card>
        <BottomNav />
      </div>
    );
  }

  const upcomingTickets = tickets?.filter(t => new Date(t.eventDate) >= new Date()) || [];
  const pastTickets = tickets?.filter(t => new Date(t.eventDate) < new Date()) || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
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
                onClick={() => setLocation('/profile')}
                className="flex items-center text-foreground"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
                {t('myTicketsSpaced')}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!tickets || tickets.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('noTicketsYet')}</h3>
              <p className="text-muted-foreground mb-4">{t('noTicketsDescription')}</p>
              <Button onClick={() => setLocation('/discover')} data-testid="button-browse-events">
                {t('browseEvents')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {upcomingTickets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {t('upcomingEvents')}
                </h3>
                <div className="space-y-3">
                  {upcomingTickets.map(ticket => (
                    <Card 
                      key={ticket.id} 
                      className={`bg-card border-border overflow-hidden transition-all ${
                        expandedTicket === ticket.id ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <CardContent className="p-0">
                        <button
                          onClick={() => handleExpandTicket(ticket)}
                          className="w-full text-left"
                          data-testid={`button-ticket-${ticket.id}`}
                        >
                          <div className="flex gap-3 p-3">
                            {ticket.eventImage ? (
                              <img 
                                src={ticket.eventImage} 
                                alt={ticket.eventTitle}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <QrCode className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">{ticket.eventTitle}</h4>
                              
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(ticket.eventDate), 'MMM d, yyyy')}</span>
                              </div>
                              
                              {ticket.eventLocation && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{ticket.eventLocation}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {ticket.tierName || 'General'}
                                </span>
                                {ticket.ticketQuantity > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    x{ticket.ticketQuantity}
                                  </span>
                                )}
                                {ticket.checkInStatus && (
                                  <span className="flex items-center gap-1 text-xs text-green-500">
                                    <CheckCircle className="w-3 h-3" />
                                    {t('checkedIn')}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <QrCode className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </div>
                        </button>
                        
                        {expandedTicket === ticket.id && (
                          <div className="border-t border-border p-4 bg-muted/30">
                            <div className="flex flex-col items-center">
                              {qrCodeUrls[ticket.id] ? (
                                <img 
                                  src={qrCodeUrls[ticket.id]} 
                                  alt="QR Code"
                                  className="w-48 h-48 rounded-lg bg-white p-2"
                                />
                              ) : (
                                <div className="w-48 h-48 rounded-lg bg-white flex items-center justify-center">
                                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                              )}
                              
                              <p className="text-xs text-muted-foreground mt-3 text-center">
                                {t('showThisQRAtEntry')}
                              </p>
                              
                              <Button
                                onClick={() => downloadQRCode(ticket)}
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                data-testid={`button-download-qr-${ticket.id}`}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                {t('downloadQR')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pastTickets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {t('pastEvents')}
                </h3>
                <div className="space-y-3">
                  {pastTickets.map(ticket => (
                    <Card 
                      key={ticket.id} 
                      className="bg-card border-border overflow-hidden opacity-60"
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {ticket.eventImage ? (
                            <img 
                              src={ticket.eventImage} 
                              alt={ticket.eventTitle}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 grayscale"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <QrCode className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{ticket.eventTitle}</h4>
                            
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(ticket.eventDate), 'MMM d, yyyy')}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              {ticket.checkInStatus ? (
                                <span className="flex items-center gap-1 text-xs text-green-500">
                                  <CheckCircle className="w-3 h-3" />
                                  {t('attended')}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {t('notAttended')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
