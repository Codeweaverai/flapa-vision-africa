
import React from 'react';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { UpdateNotification } from '@/components/pwa/UpdateNotification';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

const PWAComponents: React.FC = () => {
  return (
    <>
      <InstallPrompt />
      <UpdateNotification />
      <OfflineIndicator />
    </>
  );
};

export default PWAComponents;
