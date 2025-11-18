import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    PusherPushNotifications: any;
  }
}

const PushNotificationSetup: React.FC = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Pusher Beams SDK
    const script = document.createElement('script');
    script.src = 'https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js';
    script.async = true;
    script.onload = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
      
      console.log('Pusher Beams SDK loaded');
      console.log('Push notification support:', supported);
      console.log('Current user:', user ? 'logged in' : 'not logged in');
      console.log('Notification permission:', Notification.permission);

      if (supported && user) {
        checkSubscriptionStatus();
        
        // Show prompt if not subscribed and permission not denied
        if (Notification.permission === 'default') {
          const dismissed = sessionStorage.getItem('push-notification-dismissed');
          console.log('Notification dismissed?', dismissed);
          if (!dismissed) {
            setTimeout(() => {
              console.log('Showing push notification prompt');
              setIsVisible(true);
            }, 2000);
          }
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      if (!window.PusherPushNotifications) {
        return;
      }
      
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: '572e383b-e0d2-4eff-86ac-d066550451e0',
      });

      const deviceId = await beamsClient.getDeviceId();
      setIsSubscribed(!!deviceId);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribeToPush = async () => {
    if (!user) {
      toast.error('Please sign in to enable notifications');
      return;
    }

    if (!window.PusherPushNotifications) {
      toast.error('Push notifications SDK not loaded');
      return;
    }

    setLoading(true);

    try {
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: '572e383b-e0d2-4eff-86ac-d066550451e0',
      });

      // Start Beams and subscribe to user-specific interest
      await beamsClient.start();
      await beamsClient.addDeviceInterest(user.id);
      await beamsClient.addDeviceInterest('all-users');

      // Store device ID in backend
      const deviceId = await beamsClient.getDeviceId();
      const { error } = await supabase.functions.invoke('subscribe-push', {
        body: {
          deviceId,
          userId: user.id,
          action: 'subscribe',
        },
      });

      if (error) {
        throw error;
      }

      setIsSubscribed(true);
      setIsVisible(false);
      toast.success('Push notifications enabled!');
      
      console.log('Successfully registered with Pusher Beams!');
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!user || !window.PusherPushNotifications) {
      return;
    }

    setLoading(true);

    try {
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: '572e383b-e0d2-4eff-86ac-d066550451e0',
      });

      await beamsClient.stop();

      // Remove subscription from backend
      const { error } = await supabase.functions.invoke('subscribe-push', {
        body: {
          userId: user.id,
          action: 'unsubscribe',
        },
      });

      if (error) {
        throw error;
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
