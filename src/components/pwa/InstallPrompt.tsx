
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const InstallPrompt: React.FC = () => {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);

  if (!isInstallable || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto md:left-auto md:right-4 md:mx-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm">Install SkillPulse</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Install our app for a better experience with offline access
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1"
          >
            Install
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
          >
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallPrompt;
