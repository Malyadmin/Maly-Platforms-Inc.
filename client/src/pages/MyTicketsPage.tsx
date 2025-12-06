import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Ticket, Calendar, MapPin, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/translations";
import { BottomNav } from "@/components/ui/bottom-nav";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCode from "qrcode";

interface TicketData {
  id: number;
  eventId: number;
  eventTitle: string;
  eventImage: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  ticketIdentifier: string;
  ticketQuantity: number;
  purchaseDate: string;
  tierName: string | null;
}

export default function MyTicketsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const { data: tickets, isLoading, error } = useQuery<TicketData[]>({
    queryKey: ['/api/me/tickets'],
  });
  
  console.log('[MY_TICKETS_PAGE] Query state:', { isLoading, hasData: !!tickets, ticketCount: tickets?.length, error: error?.message });

  const handleViewQR = async (ticket: TicketData) => {
    setSelectedTicket(ticket);
    try {
      const qrDataUrl = await QRCode.toDataURL(ticket.ticketIdentifier, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        scale: 8,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleDownloadQR = async (ticket: TicketData) => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/qr`, {
        credentials: 'include'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${ticket.eventTitle.replace(/\s+/g, '-')}-${ticket.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const closeQRModal = () => {
    setSelectedTicket(null);
    setQrCodeDataUrl(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="bg-background text-foreground shrink-0 z-50">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
          <HamburgerMenu />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/discover')}
                className="flex items-center text-foreground"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
                {t('myTickets')}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('pleaseLogin')}</h3>
              <p className="text-muted-foreground text-sm mb-6">{t('loginToViewTickets')}</p>
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                data-testid="button-login"
              >
                {t('login')}
              </Button>
            </div>
          ) : !tickets || tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('noTicketsYet')}</h3>
              <p className="text-muted-foreground text-sm mb-6">{t('noTicketsDescription')}</p>
              <Button 
                onClick={() => setLocation('/discover')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                data-testid="button-browse-events"
              >
                {t('browseEvents')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="bg-card border-border overflow-hidden"
                  data-testid={`ticket-card-${ticket.id}`}
                >
                  <div className="flex">
                    <div className="w-24 h-24 shrink-0 bg-muted">
                      {ticket.eventImage ? (
                        <img 
                          src={ticket.eventImage} 
                          alt={ticket.eventTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3">
                      <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-1">
                        {ticket.eventTitle}
                      </h3>
                      {ticket.eventDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(ticket.eventDate), 'MMM d, yyyy • h:mm a')}
                        </p>
                      )}
                      {ticket.eventLocation && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2 line-clamp-1">
                          <MapPin className="w-3 h-3" />
                          {ticket.eventLocation}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewQR(ticket)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs h-7 px-3"
                          data-testid={`button-view-qr-${ticket.id}`}
                        >
                          <QrCode className="w-3 h-3 mr-1" />
                          {t('viewQR')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadQR(ticket)}
                          className="text-xs h-7 px-3"
                          data-testid={`button-download-qr-${ticket.id}`}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {t('download')}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {ticket.tierName && (
                    <div className="border-t border-border px-3 py-2 bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        {ticket.tierName} • {ticket.ticketQuantity} {ticket.ticketQuantity === 1 ? t('ticket') : t('tickets')}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={closeQRModal}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-foreground">
              {selectedTicket?.eventTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center p-4">
            {qrCodeDataUrl && (
              <div className="bg-white p-4 rounded-xl mb-4">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Ticket QR Code" 
                  className="w-48 h-48"
                  data-testid="qr-code-image"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center mb-4">
              {t('showQRAtEntry')}
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1 rounded">
              {selectedTicket?.ticketIdentifier}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
