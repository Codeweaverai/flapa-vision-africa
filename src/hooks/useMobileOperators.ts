
import { useState, useEffect } from 'react';

// Define MobileOperator type
export interface MobileOperator {
  id: string;
  name: string;
  code: string;
  country: string;
}

// Mock fetchMobileOperators function until properly implemented in eventService
const fetchMobileOperators = async (): Promise<MobileOperator[]> => {
  // This is a placeholder that will return some mock data
  return [
    { id: '1', name: 'MTN', code: 'mtn', country: 'Ghana' },
    { id: '2', name: 'Vodafone', code: 'vodafone', country: 'Ghana' },
    { id: '3', name: 'AirtelTigo', code: 'airteltigo', country: 'Ghana' }
  ];
};

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
