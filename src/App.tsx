
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import { initializeNotificationSound } from './services/notificationService';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CoursesPage from './pages/CoursesPage';
import CoursePage from './pages/CoursePage';
import CourseLearningPage from './pages/learning/CourseLearningPage';
import CourseResultsPage from './pages/CourseResultsPage';
import EventsPage from './pages/EventsPage';
import EventPage from './pages/EventPage';
import EventBookingPage from './pages/EventBookingPage';
import EventBookingConfirmationPage from './pages/EventBookingConfirmationPage';
import CreateEventPage from './pages/CreateEventPage';
import CreateCoursePage from './pages/CreateCoursePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import PaymentPage from './pages/PaymentPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import MyLearningPage from './pages/MyLearningPage';
import LearningPage from './pages/LearningPage';
import InboxPage from './pages/InboxPage';
import AccountPage from './pages/AccountPage';
import CommunityPage from './pages/CommunityPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminContactPage from './pages/admin/AdminContactPage';
import AdminBroadcastPage from './pages/admin/AdminBroadcastPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCoursesPage from './pages/creator/CreatorCoursesPage';
import CreatorEventsPage from './pages/creator/CreatorEventsPage';
import CreatorEarningsPage from './pages/creator/CreatorEarningsPage';
import CreatorProfilePage from './pages/creator/CreatorProfilePage';
import CreatorPayoutsPage from './pages/creator/CreatorPayoutsPage';
import CreatorPublicProfilePage from './pages/creator/CreatorPublicProfilePage';
import ExploreCoursesPage from './pages/explore/ExploreCoursesPage';
import ExploreEventsPage from './pages/explore/ExploreEventsPage';
import ExplorePodcastsPage from './pages/explore/ExplorePodcastsPage';
import ExploreResourcesPage from './pages/explore/ExploreResourcesPage';
import ConsultationBookingPage from './pages/ConsultationBookingPage';
import ConsultationConfirmationPage from './pages/ConsultationConfirmationPage';
import PodcastsPage from './pages/PodcastsPage';
import PodcastPlayerPage from './pages/PodcastPlayerPage';
import PublicProfilePage from './pages/PublicProfilePage';
import ResourcesPage from './pages/ResourcesPage';
import MediaPostPage from './pages/MediaPostPage';
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
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              
              {/* Course Routes */}
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/course/:courseId" element={<CoursePage />} />
              <Route path="/course/:courseId/learning" element={<CourseLearningPage />} />
              <Route path="/course/:courseId/results" element={<CourseResultsPage />} />
              <Route path="/create-course" element={<CreateCoursePage />} />
              
              {/* Event Routes */}
              <Route path="/events" element={<EventsPage />} />
              <Route path="/event/:eventId" element={<EventPage />} />
              <Route path="/event/:eventId/book" element={<EventBookingPage />} />
              <Route path="/event/:eventId/confirmation" element={<EventBookingConfirmationPage />} />
              <Route path="/create-event" element={<CreateEventPage />} />
              
              {/* Explore Routes */}
              <Route path="/explore/courses" element={<ExploreCoursesPage />} />
              <Route path="/explore/events" element={<ExploreEventsPage />} />
              <Route path="/explore/podcasts" element={<ExplorePodcastsPage />} />
              <Route path="/explore/resources" element={<ExploreResourcesPage />} />
              
              {/* Learning Routes */}
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/my-learning" element={<MyLearningPage />} />
              
              {/* Commerce Routes */}
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/order/:orderId/confirmation" element={<OrderConfirmationPage />} />
              
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
