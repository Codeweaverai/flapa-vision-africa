
import { PWAService } from './pwaService';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private pwaService: PWAService;
  private subscription: PushSubscription | null = null;

  private constructor() {
    this.pwaService = PWAService.getInstance();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initializeNotifications(): Promise<boolean> {
    const hasPermission = await this.pwaService.requestNotificationPermission();
    
    if (hasPermission) {
      this.subscription = await this.pwaService.subscribeToNotifications();
      return !!this.subscription;
    }
    
    return false;
  }

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/lovable-uploads/27c18223-7364-4962-bccc-e8a42e0db9c0.png',
        badge: payload.badge || '/lovable-uploads/27c18223-7364-4962-bccc-e8a42e0db9c0.png',
        data: payload.data
      });
    }
  }

  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  async unsubscribe(): Promise<boolean> {
    if (this.subscription) {
      try {
        await this.subscription.unsubscribe();
        this.subscription = null;
        return true;
      } catch (error) {
        console.error('Error unsubscribing from notifications:', error);
        return false;
      }
    }
    return false;
  }
}
