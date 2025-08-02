
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkplaceContext } from '@/contexts/WorkplaceContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const WorkplaceMemberRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <Navigate to="/access-denied" replace /> 
}) => {
  const { currentWorkplace, selectedWorkplaceId, loading } = useWorkplaceContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no workplace is selected, allow access (personal content)
  if (!selectedWorkplaceId) {
    return <>{children}</>;
  }

  // If workplace is selected but user is not a member, deny access
  if (selectedWorkplaceId && !currentWorkplace) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const EditorOnlyRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <Navigate to="/access-denied" replace /> 
}) => {
  const { canEdit, loading } = useWorkplaceContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canEdit) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const OwnerOnlyRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <Navigate to="/access-denied" replace /> 
}) => {
  const { userRole, loading } = useWorkplaceContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== 'owner') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const ViewerRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentWorkplace, selectedWorkplaceId, loading } = useWorkplaceContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow access if no workplace selected or user is a member
  if (!selectedWorkplaceId || currentWorkplace) {
    return <>{children}</>;
  }

  return <Navigate to="/access-denied" replace />;
};
