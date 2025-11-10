import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Download, Smartphone, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePWA } from '@/hooks/usePWA';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PWASettings: React.FC = () => {
  const { user } = useAuth();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isNotificationSupported, setIsNotificationSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsNotificationSupported(supported);
    
    if (supported) {
      setNotificationPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleInstall = async () => {
    setLoading(true);
    try {
      const success = await installApp();
      if (success) {
        toast.success('App installed successfully!');
      } else {
        toast.error('Installation cancelled');
      }
    } catch (error) {
      toast.error('Failed to install app');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!user) {
      toast.error('Please sign in to enable notifications');
      return;
    }

    setLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        setLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BDx0agxfhemcb33xmWOT5Y96mVc71Ykd_3pn7VQ_HLe2_M95ECQ6Vrr2uWd09xMNhu8dNewCoR_Oj-9v2qZya9c'
        ) as BufferSource,
      });

      // Send subscription to backend
      const { error } = await supabase.functions.invoke('subscribe-push', {
        body: {
          subscription: subscription.toJSON(),
          action: 'subscribe',
        },
      });

      if (error) {
        throw error;
      }

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
      
      // Send a test notification
      new Notification('SkillPulse Notifications Enabled', {
        body: 'You\'ll now receive updates about your courses and events',
        icon: '/lovable-uploads/logoskillpulse.png',
        badge: '/lovable-uploads/logoskillpulse.png',
      });
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        const { error } = await supabase.functions.invoke('subscribe-push', {
          body: {
            subscription: subscription.toJSON(),
            action: 'unsubscribe',
          },
        });

        if (error) {
          throw error;
        }
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return (
    <div className="space-y-4">
      {/* PWA Install Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="gradient-orange-purple p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Install App</CardTitle>
              <CardDescription>Install SkillPulse for quick access and offline mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">App is installed</span>
                </>
              ) : isInstallable ? (
                <>
                  <Download className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">App is ready to install</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">App installation not available</span>
                </>
              )}
            </div>
            {isInstallable && !isInstalled && (
              <Button
                onClick={handleInstall}
                disabled={loading}
                className="gradient-orange-purple hover:gradient-orange-purple-hover text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Install Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications Card */}
      {isNotificationSupported && user && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="gradient-orange-purple p-2 rounded-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Push Notifications</CardTitle>
                <CardDescription>Get notified about course updates and events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSubscribed ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">Notifications enabled</span>
                  </>
                ) : notificationPermission === 'denied' ? (
                  <>
                    <X className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-muted-foreground">
                      Notifications blocked (enable in browser settings)
                    </span>
                  </>
                ) : (
                  <>
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Notifications disabled</span>
                  </>
                )}
              </div>
              {notificationPermission !== 'denied' && (
                <Button
                  onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                  disabled={loading}
                  variant={isSubscribed ? 'outline' : 'default'}
                  className={!isSubscribed ? 'gradient-orange-purple hover:gradient-orange-purple-hover text-white' : ''}
                >
                  {isSubscribed ? (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PWASettings;
