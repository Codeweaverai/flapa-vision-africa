
import { supabase } from '@/lib/supabaseClient';

export interface NotificationSound {
  play: () => void;
}

// Create notification sound
const createNotificationSound = (): NotificationSound => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LyvmAcBjuZ3vLCcCIELYPO8tiILggjctLyw4ApBSOMy/DgkEoOUZ3K8djJciQL');
  audio.volume = 0.3;
  return audio;
};

let notificationSound: NotificationSound | null = null;

// Initialize sound
export const initializeNotificationSound = () => {
  if (!notificationSound) {
    try {
      notificationSound = createNotificationSound();
    } catch (error) {
      console.warn('Could not initialize notification sound:', error);
    }
  }
};

// Play notification sound
export const playNotificationSound = () => {
  try {
    if (notificationSound) {
      notificationSound.play();
    }
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

// Setup realtime notification listener
export const setupNotificationListener = (userId: string, onNotification: (notification: any) => void) => {
  try {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('New notification received:', payload);
        onNotification(payload.new);
        playNotificationSound();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to notifications channel');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    return () => {}; // Return empty cleanup function
  }
};

// Setup inbox message listener
export const setupInboxMessageListener = (userId: string, onMessage: (message: any) => void) => {
  try {
    const channel = supabase
      .channel(`inbox-messages-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inbox_messages',
        filter: `recipient_id=eq.${userId}`
      }, (payload) => {
        console.log('New inbox message received:', payload);
        onMessage(payload.new);
        playNotificationSound();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to inbox messages channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to inbox messages channel');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Error setting up inbox message listener:', error);
    return () => {}; // Return empty cleanup function
  }
};

// Setup admin notification listener for support messages
export const setupAdminNotificationListener = (onSupportMessage: (message: any) => void) => {
  try {
    const channel = supabase
      .channel('admin-support-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inbox_messages',
        filter: `recipient_id=eq.null` // Messages to admin/support
      }, (payload) => {
        console.log('New support message received:', payload);
        onSupportMessage(payload.new);
        playNotificationSound();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to admin support messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to admin support messages');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Error setting up admin notification listener:', error);
    return () => {}; // Return empty cleanup function
  }
};
