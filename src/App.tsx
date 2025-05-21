
import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
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
      return <Navigate to="/" replace />;
    }

    return <Layout>{children}</Layout>;
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <EventsPage />,
    },
    {
      path: "/events/:eventId",
      element: <EventDetailPage />,
    },
    {
      path: "/courses",
      element: <CourseLearningPage />,
    },
    {
      path: "/courses/:courseId",
      element: <CourseDetailPage />,
    },
    {
      path: "/profile",
      element: <ProtectedRoute><AccountPage /></ProtectedRoute>,
    },
    {
      path: "/events/create",
      element: <ProtectedRoute><AdminEventForm /></ProtectedRoute>,
    },
    {
      path: "/admin/dashboard",
      element: <AdminRoute><AdminDashboard /></AdminRoute>,
    },
    {
      path: "/admin/events",
      element: <AdminRoute><AdminEvents /></AdminRoute>,
    },
    {
      path: "/admin/events/create",
      element: <AdminRoute><AdminEventForm /></AdminRoute>,
    },
    {
      path: "/admin/events/:eventId",
      element: <AdminRoute><AdminEventForm /></AdminRoute>,
    },
    {
      path: "/admin/registrations",
      element: <AdminRoute><AdminRegistrations /></AdminRoute>,
    },
    {
      path: "/admin/settings",
      element: <AdminRoute><AdminSettings /></AdminRoute>,
    },
    {
      path: "/admin/courses/create",
      element: <AdminRoute><CourseForm /></AdminRoute>,
    },
    {
      path: "/admin/courses/:courseId",
      element: <AdminRoute><CourseForm /></AdminRoute>,
    },
    {
      path: "/admin/courses/content/:courseId",
      element: <AdminRoute><CourseContentPage /></AdminRoute>,
    },
    {
      path: "/creator/courses",
      element: <CreatorRoute><CreatorCourses /></CreatorRoute>,
    },
    {
      path: "/creator/courses/create",
      element: <CreatorRoute><CreatorCourseForm /></CreatorRoute>,
    },
    {
      path: "/creator/courses/:courseId",
      element: <CreatorRoute><CreatorCourseForm /></CreatorRoute>,
    },
    {
      path: "/admin/courses-list",
      element: <AdminRoute><AdminCoursesList /></AdminRoute>,
    },
  ]);

  return (
    <RouterProvider router={router} />
  );
};

export default App;
