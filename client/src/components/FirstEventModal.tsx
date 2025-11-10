import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useReferral } from '@/hooks/use-referral';
import { Share2 } from 'lucide-react';

// For sharing options
import { SiGmail, SiWhatsapp } from "react-icons/si";
import { MessageSquare, Mail, Link2 } from "lucide-react";

interface FirstEventModalProps {
  cityName: string;
  open: boolean;
  onClose: () => void;
}

export function FirstEventModal({ cityName, open, onClose }: FirstEventModalProps) {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { getShareLink } = useReferral();
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateEvent = () => {
    setLocation('/create');
    onClose();
  };

  const handleInviteFriends = async () => {
    // Get the invite URL with the user's referral code
    const shareLink = await getShareLink('invite');
    setInviteUrl(shareLink || 'https://malymvp.replit.app/join');
    setShowInviteOptions(true);
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  
  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(`Join me on Maly`);
    const body = encodeURIComponent(
      `${user?.fullName || user?.username || 'I'} invite you to join Maly - the digital nomad community! We're building a community in ${cityName}.\n\n${inviteUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onClose();
  };
  
  const handleShareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `${user?.fullName || user?.username || 'I'} invite you to join Maly - the digital nomad community! We're building a community in ${cityName}. ${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onClose();
  };
  
  const handleShareViaSMS = () => {
    const text = encodeURIComponent(
      `${user?.fullName || user?.username || 'I'} invite you to join Maly - the digital nomad community! We're building a community in ${cityName}. ${inviteUrl}`
    );
    window.location.href = `sms:?&body=${text}`;
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby="first-event-description">
        <DialogHeader>
          <DialogTitle>Be the first in {cityName}!</DialogTitle>
        </DialogHeader>
        
        {!showInviteOptions ? (
          <>
            <p id="first-event-description" className="my-4 text-sm text-muted-foreground">
              No events have been created in {cityName} yet.  
              Would you like to create the first one and invite your friends?
            </p>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Maybe Later</Button>
              <Button onClick={handleCreateEvent}>Create Event</Button>
              <Button onClick={handleInviteFriends}>Invite Friends</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4">
              <h3 className="text-base font-semibold mb-4">Invite friends to join Maly in {cityName}</h3>
              
              <div className="flex items-center space-x-2 mb-6">
                <div className="grid flex-1 gap-2">
                  <input
                    value={inviteUrl}
                    readOnly
                    className="select-all bg-muted p-2 rounded text-sm"
                  />
                </div>
                <Button onClick={handleCopyLink} variant="outline" size="sm">
                  <Link2 className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 p-3"
                  onClick={handleShareViaEmail}
                >
                  <Mail className="h-5 w-5" />
                  <span>Email</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 p-3"
                  onClick={handleShareViaWhatsApp}
                >
                  <SiWhatsapp className="h-5 w-5" />
                  <span>WhatsApp</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 p-3"
                  onClick={handleShareViaSMS}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>SMS</span>
                </Button>
              </div>
            </div>
            
            <DialogFooter className="flex justify-end gap-2">
              <BackButton variant="outline" onClick={() => setShowInviteOptions(false)} />
              <Button variant="default" onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}