
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShowUpdate(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <Alert className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto bg-blue-50 border-blue-200">
      <RefreshCw className="h-4 w-4 text-blue-600" />
      <div className="flex-1">
        <AlertTitle className="text-blue-800">Update Available</AlertTitle>
        <AlertDescription className="text-blue-700">
          A new version of SkillPulse is available.
        </AlertDescription>
      </div>
      <div className="flex gap-2 mt-2">
        <Button
          onClick={handleUpdate}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Update
        </Button>
        <Button
          variant="outline"
          onClick={handleDismiss}
          size="sm"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};

export default UpdateNotification;
