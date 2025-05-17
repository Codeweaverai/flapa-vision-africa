
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        try {
          // Check if user has admin role
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data?.role === 'admin');
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    };

    if (!loading) {
      checkAdminRole();
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
