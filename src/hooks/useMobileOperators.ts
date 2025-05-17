
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MobileOperator {
  id: string;
  name: string;
  code: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export const fetchMobileOperators = async (): Promise<MobileOperator[]> => {
  const { data, error } = await supabase
    .from('mobile_operators')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching mobile operators:', error);
    throw error;
  }

  return data || [];
};

export const useMobileOperators = () => {
  const [mobileOperators, setMobileOperators] = useState<MobileOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadMobileOperators = async () => {
      setLoading(true);
      try {
        const operators = await fetchMobileOperators();
        setMobileOperators(operators);
      } catch (err) {
        setError(err as Error);
        console.error('Error loading mobile operators:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMobileOperators();
  }, []);

  return { mobileOperators, loading, error };
};
