
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
    notificationSound = createNotificationSound();
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
  const channel = supabase
    .channel('notifications-listener')
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
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Setup inbox message listener
export const setupInboxMessageListener = (userId: string, onMessage: (message: any) => void) => {
  const channel = supabase
    .channel('inbox-messages-listener')
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
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
