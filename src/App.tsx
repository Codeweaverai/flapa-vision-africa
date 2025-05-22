
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import PublicRoute from '@/components/auth/PublicRoute';
import PrivateRoute from '@/components/auth/PrivateRoute';
import AdminRoute from '@/components/auth/AdminRoute';
import CreatorRoute from '@/components/auth/CreatorRoute';
import LoadingScreen from '@/components/common/LoadingScreen';

// Lazy-loaded components
const HomePage = lazy(() => import('@/pages/HomePage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage'));
const LearningPage = lazy(() => import('@/pages/LearningPage'));
const LearningCoursePage = lazy(() => import('@/pages/LearningCoursePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const CommunityChatPage = lazy(() => import('@/pages/CommunityChatPage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses'));
const AdminCourseForm = lazy(() => import('@/pages/admin/AdminCourseForm'));
const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
const AdminEventForm = lazy(() => import('@/pages/admin/AdminEventForm'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

// Creator pages
const CreatorDashboard = lazy(() => import('@/pages/creator/CreatorDashboard'));
const CreatorCourses = lazy(() => import('@/pages/creator/CreatorCourses'));
const CreatorCourseForm = lazy(() => import('@/pages/creator/CreatorCourseForm'));
const CreatorEvents = lazy(() => import('@/pages/creator/CreatorEvents'));
const CreatorEventForm = lazy(() => import('@/pages/creator/CreatorEventForm'));
const CreatorSettings = lazy(() => import('@/pages/creator/CreatorSettings'));
const CreatorCourseContent = lazy(() => import('@/pages/creator/CreatorCourseContent'));

// Payment pages
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'));

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/chat" element={<CommunityChatPage />} />
              <Route path="/payment-success" element={<PaymentResultPage />} />
              <Route path="/payment-canceled" element={<Navigate to="/" />} />

              {/* Protected routes */}
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
              <Route path="/learning" element={<PrivateRoute><LearningPage /></PrivateRoute>} />
              <Route path="/learning/course/:id" element={<PrivateRoute><LearningCoursePage /></PrivateRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
              <Route path="/admin/courses/create" element={<AdminRoute><AdminCourseForm /></AdminRoute>} />
              <Route path="/admin/courses/:id" element={<AdminRoute><AdminCourseForm /></AdminRoute>} />
              <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
              <Route path="/admin/events/create" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
              <Route path="/admin/events/:id" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

              {/* Creator routes */}
              <Route path="/creator" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />
              <Route path="/creator/courses" element={<CreatorRoute><CreatorCourses /></CreatorRoute>} />
              <Route path="/creator/courses/create" element={<CreatorRoute><CreatorCourseForm /></CreatorRoute>} />
              <Route path="/creator/courses/:id" element={<CreatorRoute><CreatorCourseForm /></CreatorRoute>} />
              <Route path="/creator/courses/:id/content" element={<CreatorRoute><CreatorCourseContent /></CreatorRoute>} />
              <Route path="/creator/events" element={<CreatorRoute><CreatorEvents /></CreatorRoute>} />
              <Route path="/creator/events/create" element={<CreatorRoute><CreatorEventForm /></CreatorRoute>} />
              <Route path="/creator/events/:id" element={<CreatorRoute><CreatorEventForm /></CreatorRoute>} />
              <Route path="/creator/settings" element={<CreatorRoute><CreatorSettings /></CreatorRoute>} />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
