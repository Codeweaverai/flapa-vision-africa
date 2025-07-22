
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import SmartAdvisorFloatingButton from '@/components/ai/SmartAdvisorFloatingButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
