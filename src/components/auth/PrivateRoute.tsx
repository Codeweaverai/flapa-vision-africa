import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

/**
 * PrivateRoute component that requires authentication to access
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Otherwise, render the children (protected content)
  return <>{children}</>;
};

export default PrivateRoute;
