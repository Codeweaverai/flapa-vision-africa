
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '@/constants/currencies';
import { currencyService } from '@/services/currencyService';

interface CurrencyContextType {
  currentCurrency: CurrencyCode;
  selectedCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  convertPrice: (amount: number, fromCurrency: CurrencyCode) => Promise<number>;
  formatPrice: (amount: number, currency?: CurrencyCode) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        // Check if user has a saved currency preference
        const savedCurrency = localStorage.getItem('preferred-currency') as CurrencyCode;
        
        if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
          setCurrentCurrency(savedCurrency);
        } else {
          // Detect currency based on user's location
          const detectedCurrency = await currencyService.detectUserCurrency();
          setCurrentCurrency(detectedCurrency as CurrencyCode);
        }

        // Pre-fetch exchange rates
        await currencyService.getExchangeRates();
      } catch (error) {
        console.error('Error initializing currency:', error);
        setCurrentCurrency('USD');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCurrency();
  }, []);

  const setCurrency = (currency: CurrencyCode) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferred-currency', currency);
  };

  const convertPrice = async (amount: number, fromCurrency: CurrencyCode): Promise<number> => {
    return await currencyService.convertPrice(amount, fromCurrency, currentCurrency);
  };

  const formatPrice = (amount: number, currency?: CurrencyCode): string => {
    return currencyService.formatPrice(amount, currency || currentCurrency);
  };

  const value: CurrencyContextType = {
    currentCurrency,
    selectedCurrency: currentCurrency, // Add selectedCurrency as alias for currentCurrency
    setCurrency,
    convertPrice,
    formatPrice,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
