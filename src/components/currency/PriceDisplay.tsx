
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
  showCurrencySymbol?: boolean;
  targetCurrency?: CurrencyCode;
  children?: React.ReactNode;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  originalCurrency,
  className,
  showOriginal = true,
  showAmount = true,
  showCurrencySymbol = true,
  targetCurrency,
  children
}) => {
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [isLoading, setIsLoading] = useState(false);
  const { currentCurrency } = useCurrency();
  
  // Use targetCurrency if provided, otherwise use currentCurrency from context
  const displayCurrency = targetCurrency || currentCurrency;

  useEffect(() => {
    const convertPrice = async () => {
      if (originalCurrency === displayCurrency || !amount || amount <= 0) {
        setConvertedAmount(amount);
        return;
      }

      setIsLoading(true);
      try {
        const converted = await currencyService.convertPrice(amount, originalCurrency, displayCurrency);
        setConvertedAmount(converted);
      } catch (error) {
        console.error('Error converting price:', error);
        setConvertedAmount(amount);
      } finally {
        setIsLoading(false);
      }
    };

    convertPrice();
  }, [amount, originalCurrency, displayCurrency]);

  if (isLoading) {
    return <span className={cn("animate-pulse", className)}>Converting...</span>;
  }

  const formatPrice = (price: number, currency: CurrencyCode) => {
    if (!showAmount) {
      const formatted = currencyService.formatCurrency(0, currency);
      return showCurrencySymbol ? formatted.replace(/[\d.,]/g, '').trim() : '';
    }
    return showCurrencySymbol ? currencyService.formatCurrency(price, currency) : price.toString();
  };

  return (
    <span className={className}>
      {formatPrice(convertedAmount, displayCurrency)}
      {showOriginal && originalCurrency !== displayCurrency && (
        <span className="text-xs text-muted-foreground ml-1">
          ({formatPrice(amount, originalCurrency)})
        </span>
      )}
      {children}
    </span>
  );
};

export default PriceDisplay;
