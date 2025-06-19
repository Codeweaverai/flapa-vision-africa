
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import UpdateNotification from '@/components/pwa/UpdateNotification';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
      
      {/* PWA Components */}
      <InstallPrompt />
      <OfflineIndicator />
      <UpdateNotification />
    </div>
  );
};

export default Layout;
