
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt only if installable and not already installed
    if (isInstallable && !isInstalled) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  if (!isInstallable || isInstalled || !isVisible) {
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
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto md:left-auto md:right-4 md:mx-0 shadow-2xl border-2 border-primary/20 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom-5 duration-500">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="gradient-orange-purple p-2.5 rounded-xl shadow-lg">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Install SkillPulse
              </CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground">
                Quick access • Offline mode • Better experience
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
            onClick={handleInstall}
            className="flex-1 gradient-orange-purple hover:gradient-orange-purple-hover text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Install App
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
};

export default InstallPrompt;
