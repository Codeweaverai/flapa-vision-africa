import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PushNotificationSetup: React.FC = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported && user) {
      checkSubscriptionStatus();
      
      // Show prompt if not subscribed and permission not denied
      if (Notification.permission === 'default') {
        const dismissed = sessionStorage.getItem('push-notification-dismissed');
        if (!dismissed) {
          setTimeout(() => setIsVisible(true), 5000);
        }
      }
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
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
          // This is a placeholder - you'll need to generate your own VAPID keys
          // Run: npx web-push generate-vapid-keys
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8jQOjhE3PJnz-dZ0MJJhf7hXPmHKLYBIRXl_V_0PxSKMJC-5HYzSfk'
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
      setIsVisible(false);
      toast.success('Push notifications enabled!');
      
      // Send a test notification
      await Notification.requestPermission();
      if (Notification.permission === 'granted') {
        new Notification('SkillPulse Notifications Enabled', {
          body: 'You\'ll now receive updates about your courses and events',
          icon: '/lovable-uploads/logoskillpulse.png',
          badge: '/lovable-uploads/logoskillpulse.png',
        });
      }
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
        // Unsubscribe from push notifications
        await subscription.unsubscribe();

        // Remove subscription from backend
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

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('push-notification-dismissed', 'true');
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

  if (!isSupported || !user) {
    return null;
  }

  // If already subscribed, show a subtle indicator in settings
  if (isSubscribed && !isVisible) {
    return null;
  }

  // Show prompt to subscribe
  if (!isSubscribed && isVisible) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto md:left-auto md:right-4 md:bottom-20 md:mx-0 shadow-2xl border-2 border-primary/20 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom-5 duration-500">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="gradient-orange-purple p-2.5 rounded-xl shadow-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Stay Updated
                </CardTitle>
                <CardDescription className="text-xs mt-1 text-muted-foreground">
                  Get notified about course updates and events
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="flex gap-2">
            <button
              onClick={subscribeToPush}
              disabled={loading}
              className="flex-1 gradient-orange-purple hover:gradient-orange-purple-hover text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bell className="h-4 w-4" />
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              size="sm"
              className="px-4 hover:bg-muted"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default PushNotificationSetup;
