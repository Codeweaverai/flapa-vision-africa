
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/constants/currencies';

const CurrencySwitcher: React.FC = () => {
  const { currentCurrency, setCurrency } = useCurrency();

  return (
    <Select value={currentCurrency} onValueChange={(value: CurrencyCode) => setCurrency(value)}>
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue>
          <span className="flex items-center gap-1">
            <span>{SUPPORTED_CURRENCIES[currentCurrency].flag}</span>
            <span>{currentCurrency}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, currency]) => (
          <SelectItem key={code} value={code}>
            <span className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <span>{currency.code}</span>
              <span className="text-muted-foreground">- {currency.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySwitcher;
