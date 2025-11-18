import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    PusherPushNotifications: any;
  }
}

const PusherBeamsInitializer = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializePusher = async () => {
      if (!user || typeof window === 'undefined') return;

      try {
        // Wait for Pusher SDK to load
        if (!window.PusherPushNotifications) {
          console.log('Pusher Beams SDK not loaded yet, waiting...');
          // Try to load the SDK if not present
          if (!document.querySelector('script[src*="pusher.com/beams"]')) {
            const script = document.createElement('script');
            script.src = 'https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js';
            script.async = true;
            document.head.appendChild(script);
          }
          return;
        }

        console.log('Initializing Pusher Beams for user:', user.id);
        
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: '572e383b-e0d2-4eff-86ac-d066550451e0',
        });

        // Start the client
        await beamsClient.start();
        console.log('Pusher Beams started successfully');

        // Add interests after successful start
        try {
          await beamsClient.addDeviceInterest(`user_${user.id}`);
          await beamsClient.addDeviceInterest('hello');
          console.log('Pusher Beams interests added successfully');
        } catch (interestError) {
          console.error('Error adding interests:', interestError);
        }

      } catch (error) {
        console.error('Error initializing Pusher Beams:', error);
      }
    };

    // Wait a bit for the SDK to load and user to be ready
    const timer = setTimeout(() => {
      initializePusher();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return null; // This component doesn't render anything
};

export default PusherBeamsInitializer;
