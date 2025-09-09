
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

// Notification preferences management
export const getUserNotificationPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No preferences exist, create default ones
    const { data: newPrefs, error: createError } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        event_reminders_enabled: true,
        course_recommendations_enabled: true,
        reminder_timing_hours: 24,
        push_notifications_enabled: false,
        email_notifications_enabled: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create notification preferences:', createError);
      return null;
    }
    return newPrefs;
  }

  if (error) {
    console.error('Failed to fetch notification preferences:', error);
    return null;
  }

  return data;
};

export const updateNotificationPreferences = async (userId: string, preferences: Partial<{
  event_reminders_enabled: boolean;
  course_recommendations_enabled: boolean;
  reminder_timing_hours: number;
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
}>) => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to update notification preferences:', error);
    throw error;
  }

  return data;
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
