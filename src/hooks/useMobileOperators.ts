
import { useState, useEffect } from 'react';
import { MobileOperator, fetchMobileOperators } from '@/services/eventService';

export const useMobileOperators = () => {
  const [mobileOperators, setMobileOperators] = useState<MobileOperator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMobileOperators = async () => {
      try {
        setLoading(true);
        const operators = await fetchMobileOperators();
        setMobileOperators(operators);
      } catch (error) {
        console.error('Error loading mobile operators:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMobileOperators();
  }, []);

  return { mobileOperators, loading };
};
