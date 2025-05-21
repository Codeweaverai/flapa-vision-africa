
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import './App.css';
import Layout from './components/layout/Layout';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import AccountPage from './pages/AccountPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventForm from './pages/admin/EventForm';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminSettings from './pages/admin/AdminSettings';
import CourseLearningPage from './pages/CourseLearningPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseForm from './pages/admin/CourseForm';
import CourseContentPage from './pages/admin/CourseContentPage';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorCourseForm from './pages/creator/CreatorCourseForm';
import AdminCoursesList from './pages/admin/AdminCoursesList';
import AdminRoute from './components/admin/AdminRoute';
import CreatorRoute from './components/creator/CreatorRoute';
import AuthPage from './pages/AuthPage';

const App = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role, is_creator')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
          } else {
            setIsAdmin(data?.role === 'admin');
            // Check for the is_creator boolean field
            setIsCreator(data?.is_creator === true);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      } else {
        setIsAdmin(false);
        setIsCreator(false);
      }
    };

    checkUserRole();
  }, [user]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/auth" replace />;
    }

    return <Layout>{children}</Layout>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<EventsPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/courses" element={<CourseLearningPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      
      {/* Protected Routes */}
      <Route path="/profile" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/events/create" element={<ProtectedRoute><AdminEventForm /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
      <Route path="/admin/events/create" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
      <Route path="/admin/events/:eventId" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
      <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/courses/create" element={<AdminRoute><CourseForm /></AdminRoute>} />
      <Route path="/admin/courses/:courseId" element={<AdminRoute><CourseForm /></AdminRoute>} />
      <Route path="/admin/courses/content/:courseId" element={<AdminRoute><CourseContentPage /></AdminRoute>} />
      <Route path="/admin/courses-list" element={<AdminRoute><AdminCoursesList /></AdminRoute>} />
      
      {/* Creator Routes */}
      <Route path="/creator/courses" element={<CreatorRoute><CreatorCourses /></CreatorRoute>} />
      <Route path="/creator/courses/create" element={<CreatorRoute><CreatorCourseForm /></CreatorRoute>} />
      <Route path="/creator/courses/:courseId" element={<CreatorRoute><CreatorCourseForm /></CreatorRoute>} />
    </Routes>
  );
};

export default App;
