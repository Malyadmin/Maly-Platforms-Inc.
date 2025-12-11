import { useState, useEffect } from 'react';
import { ChevronLeft, Bell, BellOff, MessageSquare, Calendar, UserCheck, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/lib/translations';

interface NotificationSettings {
  inAppMessages: boolean;
  inAppEvents: boolean;
  inAppRsvp: boolean;
  inAppTickets: boolean;
  pushMessages: boolean;
  pushEvents: boolean;
  pushRsvp: boolean;
  pushTickets: boolean;
}

export default function NotificationPreferencesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    inAppMessages: true,
    inAppEvents: true,
    inAppRsvp: true,
    inAppTickets: true,
    pushMessages: false,
    pushEvents: false,
    pushRsvp: false,
    pushTickets: false,
  });
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device.",
        variant: "destructive",
      });
      return false;
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      toast({
        title: "Install App First",
        description: "On iOS, please add Maly to your home screen first, then enable notifications from the installed app.",
        variant: "destructive",
      });
      return false;
    }

    if (pushPermission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
        toast({
          title: "Permission Granted",
          description: "You'll now receive push notifications!",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      console.log('[PUSH] Starting push subscription...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[PUSH] Service worker ready');
      
      const vapidResponse = await fetch('/api/notifications/vapid-key');
      const { publicKey } = await vapidResponse.json();
      console.log('[PUSH] Got VAPID key');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log('[PUSH] Subscription created:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        isApple: subscription.endpoint.includes('apple.com')
      });

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      console.log('[PUSH] Subscription saved to server');
    } catch (error) {
      console.error('[PUSH] Error subscribing to push:', error);
      throw error;
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    if (key.startsWith('push') && value) {
      const granted = await requestPushPermission();
      if (!granted) {
        return;
      }
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await savePreferences(newSettings);
  };

  const savePreferences = async (newSettings: NotificationSettings) => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        toast({
          title: "Preferences Saved",
          description: "Your notification preferences have been updated.",
        });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const NotificationRow = ({
    icon: Icon,
    title,
    description,
    inAppKey,
    pushKey,
  }: {
    icon: any;
    title: string;
    description: string;
    inAppKey: keyof NotificationSettings;
    pushKey: keyof NotificationSettings;
  }) => (
    <div className="space-y-3 p-4 bg-background/30 rounded-lg border border-gray-800">
      <div className="flex items-start space-x-3">
        <Icon className="h-4 w-4 text-foreground mt-0.5" />
        <div className="flex-1">
          <h3 className="text-foreground text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pl-7">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">In-App</span>
          <Switch
            checked={settings[inAppKey]}
            onCheckedChange={(checked) => handleToggle(inAppKey, checked)}
            disabled={saving}
            data-testid={`switch-${inAppKey}`}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Push</span>
          <Switch
            checked={settings[pushKey]}
            onCheckedChange={(checked) => handleToggle(pushKey, checked)}
            disabled={saving || !pushSupported}
            data-testid={`switch-${pushKey}`}
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between pb-2">
            <img 
              src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
              alt="MÁLY" 
              className="h-14 w-auto logo-adaptive"
            />
            <HamburgerMenu />
          </div>
          
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => window.history.back()}
              className="text-foreground hover:text-foreground/70 p-1"
              aria-label="Go back"
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-foreground text-lg font-medium uppercase" style={{ letterSpacing: '0.2em' }}>
              {t('alertsSpaced')}
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {!pushSupported && (
            <Card className="bg-background/40 border-border">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <BellOff className="h-5 w-5 text-foreground mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">Push Notifications Not Available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your device or browser doesn't support push notifications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {pushSupported && pushPermission !== 'granted' && (
            <Card className="bg-background/40 border-border">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Bell className="h-5 w-5 text-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-foreground font-medium">Enable Push Notifications</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get real-time notifications on your phone when something important happens.
                    </p>
                    <Button
                      onClick={requestPushPermission}
                      className="mt-3"
                      size="sm"
                      data-testid="button-enable-push"
                    >
                      Enable Push Notifications
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-background/40 border-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Notification Preferences</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Choose how you want to be notified about different activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <NotificationRow
                icon={MessageSquare}
                title="Messages"
                description="When someone sends you a message"
                inAppKey="inAppMessages"
                pushKey="pushMessages"
              />

              <NotificationRow
                icon={Calendar}
                title="New Events"
                description="When new events matching your vibe or city are posted"
                inAppKey="inAppEvents"
                pushKey="pushEvents"
              />

              <NotificationRow
                icon={UserCheck}
                title="RSVP Updates"
                description="When your RSVP is sent, approved, or declined"
                inAppKey="inAppRsvp"
                pushKey="pushRsvp"
              />

              <NotificationRow
                icon={Ticket}
                title="Tickets"
                description="Ticket purchase confirmations and updates"
                inAppKey="inAppTickets"
                pushKey="pushTickets"
              />
            </CardContent>
          </Card>

          <Card className="bg-background/40 border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">In-App:</strong> Notifications appear within the Maly app
                </p>
                <p>
                  <strong className="text-foreground">Push:</strong> Notifications appear on your device even when the app is closed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
