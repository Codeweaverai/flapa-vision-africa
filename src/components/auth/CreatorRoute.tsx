
import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreatorRouteProps {
  children: ReactNode;
}

/**
 * CreatorRoute component that requires creator role to access
 * Redirects to login if user is not authenticated or to home if not a creator
 */
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
            .select('is_creator')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error checking creator status:', error);
            setIsCreator(false);
          } else {
            setIsCreator(data?.is_creator || false);
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
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (!isCreator) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default CreatorRoute;
