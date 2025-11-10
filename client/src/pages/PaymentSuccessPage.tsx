import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ChevronLeft } from 'lucide-react';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

interface TempTicketData {
    tempId: string;
    eventId: number;
    userId: number;
    eventName: string;
    timestamp: number;
}

const PaymentSuccessPage: React.FC = () => {
    const [location] = useLocation();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [ticketData, setTicketData] = useState<TempTicketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('Payment successful page loaded for session:', sessionId);
        setIsLoading(true);
        setError(null);
        
        try {
            const storedData = localStorage.getItem('temp_ticket_data');
            
            if (storedData) {
                // Primary path: Use data from localStorage
                const parsedData: TempTicketData = JSON.parse(storedData);
                setTicketData(parsedData);
                console.log("Retrieved temporary ticket data:", parsedData);

                // Generate QR code using the tempId from localStorage
                QRCode.toDataURL(parsedData.tempId, { errorCorrectionLevel: 'H', margin: 1, scale: 8 })
                    .then(url => {
                        setQrCodeUrl(url);
                        console.log("Generated QR Code URL from localStorage tempId:", parsedData.tempId);
                        // Clear the temporary data after successful QR generation
                        localStorage.removeItem('temp_ticket_data'); 
                    })
                    .catch(err => {
                        console.error('QR Code generation failed:', err);
                        setError('Failed to generate QR code. Please contact support.');
                        localStorage.removeItem('temp_ticket_data');
                    })
                    .finally(() => setIsLoading(false));
            } else {
                // Fallback path: Generate a QR code using the session ID or a new UUID
                console.log("No temporary ticket data found in localStorage. Using fallback method.");
                
                // Create fallback ticket data with the session ID or a new UUID as tempId
                const fallbackTempId = sessionId || uuidv4();
                const fallbackTicketData: TempTicketData = {
                    tempId: fallbackTempId,
                    eventId: 0, // Default value since we don't know the event ID
                    userId: 0,  // Default value since we don't know the user ID
                    eventName: "Purchased Ticket", // Default name
                    timestamp: Date.now()
                };
                
                setTicketData(fallbackTicketData);
                console.log("Created fallback ticket data:", fallbackTicketData);
                
                // Generate QR code using the fallback ID
                QRCode.toDataURL(fallbackTempId, { errorCorrectionLevel: 'H', margin: 1, scale: 8 })
                    .then(url => {
                        setQrCodeUrl(url);
                        console.log("Generated QR Code URL from fallback ID:", fallbackTempId);
                    })
                    .catch(err => {
                        console.error('QR Code generation failed:', err);
                        setError('Failed to generate QR code. Please contact support.');
                    })
                    .finally(() => setIsLoading(false));
            }
        } catch (e) {
             console.error("Error processing temporary ticket data:", e);
             setError("An error occurred processing your ticket information.");
             setIsLoading(false);
        }

    }, [sessionId]); // Run only once on load based on session ID change

    const handleDownloadQR = () => {
        if (!qrCodeUrl || !ticketData) return;
        
        // Create an anchor element and trigger download
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `ticket-qr-${ticketData.eventId || 'event'}-${ticketData.tempId.substring(0,8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto p-4 text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
            <p className="mb-4">Thank you for your purchase. Your ticket QR code is ready below.</p>
            <p className="text-xs text-orange-400 mb-4">(Please save this QR code - you'll need it for event entry)</p>

            {isLoading && (
                <div className="flex items-center justify-center my-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Generating QR Code...</span>
                </div>
            )}

            {error && (
                <p className="text-red-500 my-4">{error}</p>
            )}

            {qrCodeUrl && ticketData && (
                <div className="flex flex-col items-center">
                     <div className="border p-4 bg-white mb-4 rounded shadow-md">
                         <img src={qrCodeUrl} alt="Ticket QR Code" className="w-64 h-64" />
                     </div>
                     <Button 
                        onClick={handleDownloadQR}
                        className="inline-flex items-center my-4 px-6"
                        size="lg"
                     >
                         <Download className="h-5 w-5 mr-2" />
                         Download Ticket QR Code
                     </Button>
                </div>
            )}

            {!isLoading && !error && !qrCodeUrl && !ticketData && (
                 <p className="text-red-500 my-4">Could not generate QR code. Please contact support.</p>
            )}

            <div className="mt-6 flex gap-4">
                <Link href="/">
                    <Button variant="outline">Go to Home</Button>
                </Link>
                {ticketData?.eventId && ticketData.eventId > 0 && (
                    <Link href={`/event/${ticketData.eventId}`}>
                        <Button variant="outline" size="icon" aria-label="Back to event">
                            <ChevronLeft className="h-5 w-5" />
                            <span className="sr-only">Back to Event</span>
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessPage; 