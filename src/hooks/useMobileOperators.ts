
import { useState, useEffect } from 'react';
import { fetchMobileOperators, MobileOperator } from '@/services/eventService';

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
