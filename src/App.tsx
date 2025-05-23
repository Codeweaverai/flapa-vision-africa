import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Account from './pages/Account';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCourse from './pages/creator/CreatorCourse';
import CreatorEditCourse from './pages/creator/CreatorEditCourse';
import CommunityPage from './pages/CommunityPage';
import CommunityChatPage from './pages/CommunityChatPage';
import CommunityCoursesPage from './pages/CommunityCoursesPage';
import CommunityNotificationsPage from './pages/CommunityNotificationsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventRegistrationPage from './pages/EventRegistrationPage';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorEventForm from './pages/creator/CreatorEventForm';
import CreatorEditEventForm from './pages/creator/CreatorEditEventForm';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import CreatorPaymentsPage from './pages/creator/CreatorPaymentsPage';
import EventTicketPage from './pages/EventTicketPage';

const App = () => {
  const [protectedRoutes, setProtectedRoutes] = useState<
    { path: string; element: JSX.Element }[]
  >([]);
  const session = useSession();
  const supabase = useSupabaseClient();
  const location = useLocation();

  useEffect(() => {
    setProtectedRoutes([
      { path: '/account', element: <Account key="account" /> },
      { path: '/courses', element: <CoursesPage key="courses" /> },
      {
        path: '/courses/:courseId',
        element: <CourseDetailsPage key="courseDetails" />,
      },
      { path: '/community', element: <CommunityPage key="community" /> },
      {
        path: '/community/chat',
        element: <CommunityChatPage key="communityChat" />,
      },
      {
        path: '/community/courses',
        element: <CommunityCoursesPage key="communityCourses" />,
      },
      {
        path: '/community/notifications',
        element: (
          <CommunityNotificationsPage key="communityNotifications" />
        ),
      },
      { path: '/events', element: <EventsPage key="events" /> },
      { path: '/events/:id', element: <EventDetailPage key="eventDetail" /> },
      {
        path: '/events/:id/register',
        element: <EventRegistrationPage key="eventRegistration" />,
      },
      {
        path: '/payment/success',
        element: <PaymentSuccessPage key="paymentSuccess" />,
      },
      {
        path: '/payment/cancel',
        element: <PaymentCancelPage key="paymentCancel" />,
      },
      {
        path: '/events/:eventId/ticket/:bookingId',
        element: <EventTicketPage />,
      },
    ]);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/auth"
        element={
          !session ? (
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'github']}
              redirectTo={`${window.location.origin}/account`}
            />
          ) : (
            <Navigate to="/account" replace state={{ from: location }} />
          )
        }
      />
      {protectedRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Creator Routes - Protected by session and creator role */}
      <Route
        path="/creator/dashboard"
        element={
          session ? (
            <CreatorDashboard />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/courses"
        element={
          session ? (
            <CreatorCourse />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/courses/edit/:courseId"
        element={
          session ? (
            <CreatorEditCourse />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events"
        element={
          session ? (
            <CreatorEvents />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events/new"
        element={
          session ? (
            <CreatorEventForm />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events/edit/:eventId"
        element={
          session ? (
            <CreatorEditEventForm />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events/:eventId/registrations"
        element={
          session ? (
            <CreatorEventRegistrations />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/payments"
        element={
          session ? (
            <CreatorPaymentsPage />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
    </Routes>
  );
};

export default App;
