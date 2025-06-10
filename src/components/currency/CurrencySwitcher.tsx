
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/constants/currencies';

const CurrencySwitcher = () => {
  const { currentCurrency, setCurrency } = useCurrency();
  const currentCurrencyInfo = SUPPORTED_CURRENCIES[currentCurrency];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all duration-200"
        >
          <DollarSign className="h-5 w-5 text-gray-600" />
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-8 p-0 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 text-xs"
          >
            {currentCurrencyInfo.symbol}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, currency]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setCurrency(code as CurrencyCode)}
            className={`flex items-center gap-3 p-3 cursor-pointer ${
              currentCurrency === code ? 'bg-gradient-to-r from-orange-50 to-purple-50' : ''
            }`}
          >
            <span className="text-lg">{currency.flag}</span>
            <div className="flex-1">
              <div className="font-medium">{currency.name}</div>
              <div className="text-sm text-muted-foreground">{currency.country}</div>
            </div>
            <div className="font-mono font-semibold">
              {currency.symbol} {code}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;
