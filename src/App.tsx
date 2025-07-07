
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/admin/AdminRoute';

// Lazy load components
const Index = lazy(() => import('./pages/Index'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const UserAccountPage = lazy(() => import('./pages/UserAccountPage'));
const UserSettingsPage = lazy(() => import('./pages/UserSettingsPage'));
const LearningPage = lazy(() => import('./pages/LearningPage'));
const MyCartPage = lazy(() => import('./pages/MyCartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const CommunityPostPage = lazy(() => import('./pages/CommunityPostPage'));
const ConsultationBookingPage = lazy(() => import('./pages/ConsultationBookingPage'));
const SpeakingBookingPage = lazy(() => import('./pages/SpeakingBookingPage'));
const VideoCallPage = lazy(() => import('./pages/VideoCallPage'));
const RecordingsPage = lazy(() => import('./pages/RecordingsPage'));
const CourseLearningPage = lazy(() => import('./pages/learning/CourseLearningPage'));
const CourseResultsPage = lazy(() => import('./pages/CourseResultsPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const ExploreCoursesPage = lazy(() => import('./pages/ExploreCoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const ExploreEventsPage = lazy(() => import('./pages/ExploreEventsPage'));
const CreatorProfilePage = lazy(() => import('./pages/CreatorProfilePage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'));
const WatchPartyPage = lazy(() => import('./pages/WatchPartyPage'));
const PodcastsPage = lazy(() => import('./pages/PodcastsPage'));
const PodcastDetailPage = lazy(() => import('./pages/PodcastDetailPage'));
const PodcastEpisodePage = lazy(() => import('./pages/PodcastEpisodePage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminEnrollmentsPage = lazy(() => import('./pages/admin/AdminEnrollmentsPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));
const AdminNewsletterPage = lazy(() => import('./pages/admin/AdminNewsletterPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminPodcastsPage = lazy(() => import('./pages/admin/AdminPodcastsPage'));
const AdminResourcesPage = lazy(() => import('./pages/admin/AdminResourcesPage'));
const AdminMediaPage = lazy(() => import('./pages/admin/AdminMediaPage'));
const AdminContactPage = lazy(() => import('./pages/admin/AdminContactPage'));
const AdminSpeakersPage = lazy(() => import('./pages/admin/AdminSpeakersPage'));
const AdminPayoutsPage = lazy(() => import('./pages/admin/AdminPayoutsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminCreatorsPage = lazy(() => import('./pages/admin/AdminCreatorsPage'));

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/explore/courses" element={<ExploreCoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/explore/events" element={<ExploreEventsPage />} />
                <Route path="/creator/profile/:id" element={<CreatorProfilePage />} />
                <Route path="/podcasts" element={<PodcastsPage />} />
                <Route path="/podcasts/:id" element={<PodcastDetailPage />} />
                <Route path="/podcasts/:id/episodes/:episodeId" element={<PodcastEpisodePage />} />
                <Route path="/newsletter" element={<NewsletterPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/careers" element={<CareersPage />} />

                {/* Protected routes */}
                <Route 
                  path="/account" 
                  element={
                    <ProtectedRoute>
                      <UserAccountPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <UserSettingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learning" 
                  element={
                    <ProtectedRoute>
                      <LearningPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/learning/course/:id" 
                  element={
                    <ProtectedRoute>
                      <CourseLearningPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/courses/:courseId/results" 
                  element={
                    <ProtectedRoute>
                      <CourseResultsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/course/:courseId/lesson/:lessonId" 
                  element={
                    <ProtectedRoute>
                      <LessonPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cart" 
                  element={
                    <ProtectedRoute>
                      <MyCartPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/inbox" 
                  element={
                    <ProtectedRoute>
                      <InboxPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/community" 
                  element={
                    <ProtectedRoute>
                      <CommunityPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/community/post/:id" 
                  element={
                    <ProtectedRoute>
                      <CommunityPostPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/book-consultation" 
                  element={
                    <ProtectedRoute>
                      <ConsultationBookingPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/book-speaking" 
                  element={
                    <ProtectedRoute>
                      <SpeakingBookingPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/video-call/:id" 
                  element={
                    <ProtectedRoute>
                      <VideoCallPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/recordings" 
                  element={
                    <ProtectedRoute>
                      <RecordingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/payment-success" 
                  element={
                    <ProtectedRoute>
                      <PaymentSuccessPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/tickets" 
                  element={
                    <ProtectedRoute>
                      <MyTicketsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/watch-party/:id" 
                  element={
                    <ProtectedRoute>
                      <WatchPartyPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin routes */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/courses" 
                  element={
                    <AdminRoute>
                      <AdminCoursesPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/events" 
                  element={
                    <AdminRoute>
                      <AdminEventsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/orders" 
                  element={
                    <AdminRoute>
                      <AdminOrdersPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/enrollments" 
                  element={
                    <AdminRoute>
                      <AdminEnrollmentsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/bookings" 
                  element={
                    <AdminRoute>
                      <AdminBookingsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/newsletter" 
                  element={
                    <AdminRoute>
                      <AdminNewsletterPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <AdminRoute>
                      <AdminSettingsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/podcasts" 
                  element={
                    <AdminRoute>
                      <AdminPodcastsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/resources" 
                  element={
                    <AdminRoute>
                      <AdminResourcesPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/media" 
                  element={
                    <AdminRoute>
                      <AdminMediaPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/contact" 
                  element={
                    <AdminRoute>
                      <AdminContactPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/speakers" 
                  element={
                    <AdminRoute>
                      <AdminSpeakersPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/payouts" 
                  element={
                    <AdminRoute>
                      <AdminPayoutsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <AdminRoute>
                      <AdminAnalyticsPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/creators" 
                  element={
                    <AdminRoute>
                      <AdminCreatorsPage />
                    </AdminRoute>
                  } 
                />

                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
