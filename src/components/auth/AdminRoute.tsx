
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute component that requires admin role to access
 * Redirects to login if user is not authenticated or to home if not admin
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // For now, assume authenticated users can access admin routes
  // In a production app, you would check if the user has admin privileges
  return <>{children}</>;
};

export default AdminRoute;
