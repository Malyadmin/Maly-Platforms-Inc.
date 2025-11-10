import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellOff, MessageSquare, Calendar, UserCheck, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

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
    // Check if push notifications are supported
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

    // iOS requires subscription from standalone PWA, not Safari tab
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
      
      // Get the VAPID public key from the server
      const vapidResponse = await fetch('/api/notifications/vapid-key');
      const { publicKey } = await vapidResponse.json();
      console.log('[PUSH] Got VAPID key');

      // Required for iOS: userVisibleOnly must be true
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log('[PUSH] Subscription created:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        isApple: subscription.endpoint.includes('apple.com')
      });

      // Send subscription to server
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
    // If enabling any push notification, request permission first
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
    <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-gray-800">
      <div className="flex items-start space-x-3">
        <Icon className="h-4 w-4 text-purple-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-white text-sm font-medium">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-gray-800">
        <div className="flex items-center justify-between px-5 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white p-2 hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <h1 className="gradient-text text-lg font-medium uppercase tracking-widest">
            Notifications
          </h1>
          
          <HamburgerMenu />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Push Notification Status */}
          {!pushSupported && (
            <Card className="bg-yellow-950 border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <BellOff className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-200 font-medium">Push Notifications Not Available</p>
                    <p className="text-sm text-yellow-300 mt-1">
                      Your device or browser doesn't support push notifications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {pushSupported && pushPermission !== 'granted' && (
            <Card className="bg-blue-950 border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Bell className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-blue-200 font-medium">Enable Push Notifications</p>
                    <p className="text-sm text-blue-300 mt-1">
                      Get real-time notifications on your phone when something important happens.
                    </p>
                    <Button
                      onClick={requestPushPermission}
                      className="mt-3 bg-blue-600 hover:bg-blue-700"
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

          {/* Notification Categories */}
          <Card className="bg-black/40 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-400 text-xs">
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

          {/* Info Card */}
          <Card className="bg-black/40 border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-2 text-xs text-gray-400">
                <p>
                  <strong className="text-white">In-App:</strong> Notifications appear within the Maly app
                </p>
                <p>
                  <strong className="text-white">Push:</strong> Notifications appear on your device even when the app is closed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
