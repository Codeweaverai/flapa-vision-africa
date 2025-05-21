
import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface CreatorRouteProps {
  children: ReactNode;
}

const CreatorRoute = ({ children }: CreatorRouteProps) => {
  const { user, loading } = useAuth();
  const [isCreator, setIsCreator] = useState<boolean | null>(null);
  const [checkingCreator, setCheckingCreator] = useState(true);

  useEffect(() => {
    const verifyCreatorStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role, is_creator')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
            setIsCreator(false);
          } else {
            // Check either role or is_creator flag
            setIsCreator(data?.is_creator === true);
          }
        } catch (error) {
          console.error('Error checking creator status:', error);
          setIsCreator(false);
        }
      } else {
        setIsCreator(false);
      }
      setCheckingCreator(false);
    };

    if (!loading) {
      verifyCreatorStatus();
    }
  }, [user, loading]);

  if (loading || checkingCreator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isCreator) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default CreatorRoute;
