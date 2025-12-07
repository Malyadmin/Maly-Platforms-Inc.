import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Share2, Link2, Twitter, Mail, MessageCircle, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { Separator } from "./separator";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  url: string;
}

export function ShareDialog({ isOpen, onClose, title, description, url }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteLink = `${window.location.origin}/join?ref=invite`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleInviteCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link: ", err);
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    }
  };

  const shareViaTwitter = () => {
    const text = `Check out ${title}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank");
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`Check out this event:\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-accent">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>Share Event</DialogTitle>
              <DialogDescription>
                Choose how you'd like to share this event
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                value={url}
                readOnly
                className="select-all bg-muted"
              />
            </div>
            <Button onClick={handleCopy} variant="outline" className="shrink-0">
              <Link2 className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={shareViaTwitter}
              variant="outline"
              className="w-full"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button 
              onClick={shareViaWhatsApp}
              variant="outline"
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={shareViaEmail}
              variant="outline"
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
          {navigator.share && (
            <Button onClick={shareViaWebShare} className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}

          <Separator className="my-2" />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Invite Friends to Maly</h4>
            <p className="text-sm text-muted-foreground">Share this link to invite friends to join Maly</p>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="select-all bg-muted"
                />
              </div>
              <Button onClick={handleInviteCopy} variant="outline" className="shrink-0">
                <UserPlus className="h-4 w-4 mr-2" />
                {inviteCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}