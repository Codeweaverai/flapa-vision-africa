
import React, { useState, useEffect } from 'react';
import { currencyService } from '@/services/currencyService';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyCode } from '@/constants/currencies';
import { cn } from '@/lib/utils';

export interface PriceDisplayProps {
  amount: number;
  originalCurrency: CurrencyCode;
  className?: string;
  showOriginal?: boolean;
  showAmount?: boolean;
  children?: React.ReactNode;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  originalCurrency,
  className,
  showOriginal = true,
  showAmount = true,
  children
}) => {
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [isLoading, setIsLoading] = useState(false);
  const { currency: targetCurrency } = useCurrency();

  useEffect(() => {
    const convertPrice = async () => {
      if (originalCurrency === targetCurrency || !amount || amount <= 0) {
        setConvertedAmount(amount);
        return;
      }

      setIsLoading(true);
      try {
        const converted = await currencyService.convertPrice(amount, originalCurrency, targetCurrency);
        setConvertedAmount(converted);
      } catch (error) {
        console.error('Error converting price:', error);
        setConvertedAmount(amount);
      } finally {
        setIsLoading(false);
      }
    };

    convertPrice();
  }, [amount, originalCurrency, targetCurrency]);

  if (isLoading) {
    return <span className={cn("animate-pulse", className)}>Converting...</span>;
  }

  const formatPrice = (price: number, currency: CurrencyCode) => {
    if (!showAmount) {
      return currencyService.formatCurrency(0, currency).replace(/[\d.,]/g, '').trim();
    }
    return currencyService.formatCurrency(price, currency);
  };

  return (
    <span className={className}>
      {formatPrice(convertedAmount, targetCurrency)}
      {showOriginal && originalCurrency !== targetCurrency && (
        <span className="text-xs text-muted-foreground ml-1">
          ({formatPrice(amount, originalCurrency)})
        </span>
      )}
      {children}
    </span>
  );
};

export default PriceDisplay;
