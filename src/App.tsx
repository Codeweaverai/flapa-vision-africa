
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { supabase } from './lib/supabaseClient';
import { initializeNotificationSound } from './services/notificationService';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseLearningPage from './pages/learning/CourseLearningPage';
import CourseResultsPage from './pages/CourseResultsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import LearningPage from './pages/LearningPage';
import InboxPage from './pages/InboxPage';
import AccountPage from './pages/AccountPage';
import CommunityPage from './pages/CommunityPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsers';
import AdminCoursesPage from './pages/admin/AdminCourses';
import AdminEventsPage from './pages/admin/AdminEvents';
import AdminOrdersPage from './pages/admin/AdminOrders';
import AdminSettingsPage from './pages/admin/AdminSettings';
import AdminContactPage from './pages/admin/AdminContactSubmissions';
import AdminBroadcastPage from './pages/admin/AdminBroadcast';
import AdminReportsPage from './pages/admin/AdminReports';
import AdminPayoutsPage from './pages/admin/AdminPayouts';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCoursesPage from './pages/creator/CreatorCourses';
import CreatorEventsPage from './pages/creator/CreatorEvents';
import CreatorEarningsPage from './pages/creator/CreatorEarnings';
import CreatorProfilePage from './pages/creator/CreatorProfile';
import CreatorPayoutsPage from './pages/creator/CreatorPayouts';
import CreatorPublicProfilePage from './pages/creator/CreatorPublicProfile';
import ExploreCoursesPage from './pages/ExploreCoursesPage';
import ExploreEventsPage from './pages/ExploreEventsPage';
import ExplorePodcastsPage from './pages/ExplorePodcastsPage';
import ExploreResourcesPage from './pages/ExploreResourcesPage';
import ConsultationBookingPage from './pages/ConsultationBookingPage';
import ConsultationConfirmationPage from './pages/ConsultationConfirmationPage';
import PodcastsPage from './pages/PodcastsPage';
import PodcastPlayerPage from './pages/PodcastPlayerPage';
import PublicProfilePage from './pages/PublicProfilePage';
import ResourcesPage from './pages/ResourcesPage';
import MediaPostPage from './pages/MediaPostPage';
import MyEventsPage from './pages/MyEventsPage';
import MobileBottomNav from './components/navigation/MobileBottomNav';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Initialize notification sound
    initializeNotificationSound();
    
    // Log initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.info('Initial session check:', !!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('Auth state change:', event, !!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                
                {/* Course Routes */}
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/course/:courseId" element={<CourseDetailPage />} />
                <Route path="/course/:courseId/learning" element={<CourseLearningPage />} />
                <Route path="/course/:courseId/results" element={<CourseResultsPage />} />
                
                {/* Event Routes */}
                <Route path="/events" element={<EventsPage />} />
                <Route path="/event/:eventId" element={<EventDetailPage />} />
                <Route path="/my-events" element={<MyEventsPage />} />
                
                {/* Explore Routes */}
                <Route path="/explore/courses" element={<ExploreCoursesPage />} />
                <Route path="/explore/events" element={<ExploreEventsPage />} />
                <Route path="/explore/podcasts" element={<ExplorePodcastsPage />} />
                <Route path="/explore/resources" element={<ExploreResourcesPage />} />
                
                {/* Learning Routes */}
                <Route path="/learning" element={<LearningPage />} />
                
                {/* Commerce Routes */}
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
                
                {/* User Routes */}
                <Route path="/account" element={<AccountPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/community" element={<CommunityPage />} />
                
                {/* Media Routes */}
                <Route path="/podcasts" element={<PodcastsPage />} />
                <Route path="/podcast/:podcastId" element={<PodcastPlayerPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/media/:postId" element={<MediaPostPage />} />
                
                {/* Profile Routes */}
                <Route path="/profile/:userId" element={<PublicProfilePage />} />
                
                {/* Consultation Routes */}
                <Route path="/consultation/book" element={<ConsultationBookingPage />} />
                <Route path="/consultation/confirmation" element={<ConsultationConfirmationPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/courses" element={<AdminCoursesPage />} />
                <Route path="/admin/events" element={<AdminEventsPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/contact" element={<AdminContactPage />} />
                <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
                
                {/* Creator Routes */}
                <Route path="/creator" element={<CreatorDashboard />} />
                <Route path="/creator/courses" element={<CreatorCoursesPage />} />
                <Route path="/creator/events" element={<CreatorEventsPage />} />
                <Route path="/creator/earnings" element={<CreatorEarningsPage />} />
                <Route path="/creator/profile" element={<CreatorProfilePage />} />
                <Route path="/creator/profile/:creatorId" element={<CreatorPublicProfilePage />} />
                <Route path="/creator/payouts" element={<CreatorPayoutsPage />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <MobileBottomNav />
            </Layout>
            <Toaster position="top-right" />
          </Router>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
