import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import './App.css';
import Layout from '@/components/layout/Layout';
import EventList from '@/pages/EventList';
import EventDetails from '@/pages/EventDetails';
import Profile from '@/pages/Profile';
import EventForm from '@/pages/EventForm';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminEventForm from '@/pages/admin/AdminEventForm';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminSettings from '@/pages/admin/AdminSettings';
import CourseList from '@/pages/CourseList';
import CourseDetails from '@/pages/CourseDetails';
import CourseForm from '@/pages/admin/CourseForm';
import CourseContent from '@/pages/CourseContent';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorCourseForm from '@/pages/creator/CreatorCourseForm';
import AdminRoute from '@/components/routes/AdminRoute';
import CreatorRoute from '@/components/routes/CreatorRoute';
import AdminCoursesList from '@/pages/admin/AdminCoursesList';

const App = () => {
  const { authUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (authUser) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUser.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
          } else {
            setIsAdmin(data?.role === 'admin');
            setIsCreator(data?.role === 'creator');
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
  }, [authUser]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!authUser) {
      return <Navigate to="/" replace />;
    }

    return <Layout>{children}</Layout>;
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <EventList />,
    },
    {
      path: "/events/:eventId",
      element: <EventDetails />,
    },
    {
      path: "/courses",
      element: <CourseList />,
    },
    {
      path: "/courses/:courseId",
      element: <CourseDetails />,
    },
    {
      path: "/profile",
      element: <ProtectedRoute><Profile /></ProtectedRoute>,
    },
    {
      path: "/events/create",
      element: <ProtectedRoute><EventForm /></ProtectedRoute>,
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
      element: <AdminRoute><CourseContent /></AdminRoute>,
    },
    {
      path: "/creator/courses",
      element: <CreatorRoute><CreatorCourses /></CreatorRoute>,
    },
    {
      path: "/creator/courses/create",
      element: <CreatorRoute><CreatorCourseForm creatorId={authUser?.id} isCreator={true} /></CreatorRoute>,
    },
     {
      path: "/creator/courses/:courseId",
      element: <CreatorRoute><CreatorCourseForm creatorId={authUser?.id} isCreator={true} /></CreatorRoute>,
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
