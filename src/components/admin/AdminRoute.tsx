
import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkIsAdmin } from '@/services/adminService';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (user) {
        const adminStatus = await checkIsAdmin(user);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    };

    if (!loading) {
      verifyAdminStatus();
    }
  }, [user, loading]);

  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-purple">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin-login" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
