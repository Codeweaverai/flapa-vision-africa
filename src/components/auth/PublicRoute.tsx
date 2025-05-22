import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * PublicRoute component that redirects authenticated users to the home page
 * and allows unauthenticated users to access the route
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user is authenticated, redirect to the home page
  if (user) {
    return <Navigate to="/" />;
  }

  // Otherwise, render the children (login/register page)
  return <>{children}</>;
};

export default PublicRoute;
