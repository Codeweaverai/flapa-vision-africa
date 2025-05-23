
import React, { useEffect, useState } from 'react';
import {
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EventTicketPage from './pages/EventTicketPage';

const App = () => {
  const [protectedRoutes, setProtectedRoutes] = useState<
    { path: string; element: JSX.Element }[]
  >([]);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setProtectedRoutes([
      { path: '/account', element: <div>Account Page</div> },
      { path: '/courses', element: <div>Courses Page</div> },
      {
        path: '/courses/:courseId',
        element: <div>Course Details Page</div>,
      },
      { path: '/community', element: <div>Community Page</div> },
      {
        path: '/community/chat',
        element: <div>Community Chat Page</div>,
      },
      {
        path: '/community/courses',
        element: <div>Community Courses Page</div>,
      },
      {
        path: '/community/notifications',
        element: <div>Community Notifications Page</div>,
      },
      { path: '/events', element: <div>Events Page</div> },
      { path: '/events/:id', element: <div>Event Detail Page</div> },
      {
        path: '/events/:id/register',
        element: <div>Event Registration Page</div>,
      },
      {
        path: '/payment/success',
        element: <div>Payment Success Page</div>,
      },
      {
        path: '/payment/cancel',
        element: <div>Payment Cancel Page</div>,
      },
      {
        path: '/events/:eventId/ticket/:bookingId',
        element: <EventTicketPage />,
      },
    ]);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<div>Home Page</div>} />
      <Route path="/pricing" element={<div>Pricing Page</div>} />
      <Route
        path="/auth"
        element={
          !user ? (
            <div>Auth Page</div>
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
          user ? (
            <div>Creator Dashboard</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/courses"
        element={
          user ? (
            <div>Creator Courses</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/courses/edit/:courseId"
        element={
          user ? (
            <div>Creator Edit Course</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events"
        element={
          user ? (
            <div>Creator Events</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events/new"
        element={
          user ? (
            <div>Creator New Event Form</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events/edit/:eventId"
        element={
          user ? (
            <div>Creator Edit Event Form</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/events/:eventId/registrations"
        element={
          user ? (
            <div>Creator Event Registrations</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/creator/payments"
        element={
          user ? (
            <div>Creator Payments Page</div>
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
    </Routes>
  );
};

export default App;
