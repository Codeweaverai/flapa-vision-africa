
import React, { useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyCode } from '@/constants/currencies';

interface PriceDisplayProps {
  amount: number;
  originalCurrency?: CurrencyCode;
  className?: string;
  showOriginal?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  originalCurrency = 'USD',
  className = '',
  showOriginal = false
}) => {
  const { currentCurrency, convertPrice, formatPrice, isLoading } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const performConversion = async () => {
      if (isLoading || originalCurrency === currentCurrency) {
        setConvertedAmount(amount);
        return;
      }

      setConverting(true);
      try {
        const converted = await convertPrice(amount, originalCurrency);
        setConvertedAmount(converted);
      } catch (error) {
        console.error('Error converting price:', error);
        setConvertedAmount(amount);
      } finally {
        setConverting(false);
      }
    };

    performConversion();
  }, [amount, originalCurrency, currentCurrency, convertPrice, isLoading]);

  if (isLoading || converting) {
    return (
      <span className={className}>
        {formatPrice(amount, originalCurrency)}
      </span>
    );
  }

  const displayPrice = formatPrice(convertedAmount, currentCurrency);
  const originalPrice = formatPrice(amount, originalCurrency);

  return (
    <span className={className}>
      {displayPrice}
      {showOriginal && originalCurrency !== currentCurrency && (
        <span className="text-sm text-muted-foreground ml-1">
          (~{originalPrice})
        </span>
      )}
    </span>
  );
};

export default PriceDisplay;
