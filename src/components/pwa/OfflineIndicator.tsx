
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="fixed top-20 left-4 right-4 z-50 max-w-sm mx-auto bg-orange-50 border-orange-200">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        You're offline. Some features may be limited.
      </AlertDescription>
    </Alert>
  );
};

export default OfflineIndicator;
