import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Import pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import AuthPage from '@/pages/AuthPage';
import BecomeCreatorPage from '@/pages/BecomeCreatorPage';
import AccountPage from '@/pages/AccountPage';
import ProfilePage from '@/pages/ProfilePage';
import PricingPage from '@/pages/PricingPage';
import LearningPage from '@/pages/LearningPage';
import CommunityPage from '@/pages/CommunityPage';
import MediaPage from '@/pages/MediaPage';
import ContactPage from '@/pages/ContactPage';
import HelpPage from '@/pages/HelpPage';
import CourseDetailPage from '@/pages/learning/CourseDetailPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import MyEventsPage from '@/pages/MyEventsPage';
import NotificationsPage from '@/pages/NotificationsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/become-creator" element={<BecomeCreatorPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/learning/course-detail/:courseId" element={<CourseDetailPage />} />
              <Route path="/my-courses" element={<MyCoursesPage />} />
              <Route path="/my-events" element={<MyEventsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
