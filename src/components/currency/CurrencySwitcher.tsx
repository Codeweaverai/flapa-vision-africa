import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { SUPPORTED_CURRENCIES, CurrencyCode, COUNTRY_TO_CURRENCY } from '@/constants/currencies';
import { currencyService } from '@/services/currencyService';
import { toast } from 'sonner';
import { Loader2, Globe } from 'lucide-react';

const CurrencySwitcher: React.FC = () => {
  const { currentCurrency, setCurrency, isLoading: contextLoading } = useCurrency();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // Load user's currency preference from database and sync with context
  useEffect(() => {
    const loadUserCurrencyPreference = async () => {
      if (!user) {
        // For non-logged in users, just mark as initialized
        setInitialized(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_currency_preferences')
          .select('default_currency, country_code, detected_by_ip')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading currency preference:', error);
        }

        if (data && data.default_currency) {
          const dbCurrency = data.default_currency as CurrencyCode;
          setUserCountry(data.country_code);
          
          // Only update if different from current context and valid
          if (dbCurrency !== currentCurrency && SUPPORTED_CURRENCIES[dbCurrency]) {
            console.log('Setting currency from database:', dbCurrency);
            setCurrency(dbCurrency);
            localStorage.setItem('preferred-currency', dbCurrency);
          }
        } else {
          // Create default preference using detected currency
          await createDefaultCurrencyPreference();
        }
      } catch (error) {
        console.error('Error loading currency preference:', error);
      } finally {
        setInitialized(true);
      }
    };

    // Wait for context to finish initializing before loading user preferences
    if (!contextLoading) {
      loadUserCurrencyPreference();
    }
  }, [user, currentCurrency, setCurrency, contextLoading]);

  const detectUserCountryAndCurrency = async (): Promise<{ country: string | null; currency: CurrencyCode }> => {
    try {
      // Try to get user's country from IP
      const response = await fetch('https://ipapi.co/json/');
      const ipData = await response.json();
      
      const countryCode = ipData?.country_code;
      const detectedCurrency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
      
      return {
        country: countryCode,
        currency: detectedCurrency as CurrencyCode
      };
    } catch (error) {
      console.log('IP detection failed, using browser detection');
      // Fallback to browser-based detection
      const browserCurrency = await currencyService.detectUserCurrency();
      return {
        country: null,
        currency: browserCurrency as CurrencyCode
      };
    }
  };

  const createDefaultCurrencyPreference = async () => {
    if (!user) return;

    try {
      const { country, currency: detectedCurrency } = await detectUserCountryAndCurrency();
      
      // Use detected currency or fallback to current context
      const finalCurrency = SUPPORTED_CURRENCIES[detectedCurrency] ? detectedCurrency : currentCurrency;

      const { error } = await supabase
        .from('user_currency_preferences')
        .insert({
          user_id: user.id,
          default_currency: finalCurrency,
          country_code: country,
          detected_by_ip: !!country,
          ip_address: null, // You can store this if needed
          device_currency: finalCurrency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log('Default currency preference created:', finalCurrency);
      
      // Update context if different
      if (finalCurrency !== currentCurrency) {
        setCurrency(finalCurrency);
        localStorage.setItem('preferred-currency', finalCurrency);
      }
      
      setUserCountry(country);
    } catch (error) {
      console.error('Error creating default currency preference:', error);
    }
  };

  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    if (!SUPPORTED_CURRENCIES[newCurrency]) {
      toast.error('Invalid currency selected');
      return;
    }

    setSaving(true);
    
    try {
      // Update context immediately for responsive UI
      setCurrency(newCurrency);
      localStorage.setItem('preferred-currency', newCurrency);

      // Save to database if user is logged in
      if (user) {
        const { error } = await supabase
          .from('user_currency_preferences')
          .upsert({
            user_id: user.id,
            default_currency: newCurrency,
            detected_by_ip: false, // User explicitly selected this
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        toast.success(`Currency updated to ${newCurrency}`);
      } else {
        toast.success(`Currency set to ${newCurrency}`);
      }
    } catch (error) {
      console.error('Error updating currency preference:', error);
      toast.error('Failed to update currency preference');
      
      // Revert context on error
      const previousCurrency = localStorage.getItem('preferred-currency') as CurrencyCode || 'USD';
      setCurrency(previousCurrency);
    } finally {
      setSaving(false);
    }
  };

  // Group currencies by region for better organization
  const majorCurrencies = ['USD', 'EUR', 'GBP'] as CurrencyCode[];
  const africanCurrencies = Object.keys(SUPPORTED_CURRENCIES)
    .filter(code => !majorCurrencies.includes(code as CurrencyCode))
    .map(code => code as CurrencyCode);

  // Show loading state while context is initializing or saving
  const showLoading = contextLoading || saving || (!initialized && user);

  return (
    <Select 
      value={currentCurrency} 
      onValueChange={handleCurrencyChange}
      disabled={showLoading}
    >
      <SelectTrigger className="w-28 h-8 text-xs border-border bg-background hover:bg-accent">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            {showLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-sm">{SUPPORTED_CURRENCIES[currentCurrency]?.flag || '💵'}</span>
            )}
            <span className="font-medium text-xs">{currentCurrency}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[240px] max-h-[400px] overflow-y-auto">
        {/* Major Currencies Section */}
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-2">Major Currencies</p>
          {majorCurrencies.map((code) => (
            <CurrencySelectItem 
              key={code}
              code={code}
              currentCurrency={currentCurrency}
              onSelect={handleCurrencyChange}
            />
          ))}
        </div>

        {/* African Currencies Section */}
        <div className="border-t border-border mt-1 pt-2">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              African Currencies
            </p>
            {africanCurrencies.map((code) => (
              <CurrencySelectItem 
                key={code}
                code={code}
                currentCurrency={currentCurrency}
                onSelect={handleCurrencyChange}
              />
            ))}
          </div>
        </div>

        {/* User Info Section */}
        {user && (
          <>
            <div className="h-px bg-border my-1" />
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                {userCountry ? `Detected from ${userCountry}` : 'Saved to your account'}
              </p>
            </div>
          </>
        )}
      </SelectContent>
    </Select>
  );
};

// Helper component for currency items
const CurrencySelectItem: React.FC<{
  code: CurrencyCode;
  currentCurrency: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
}> = ({ code, currentCurrency, onSelect }) => {
  const currency = SUPPORTED_CURRENCIES[code];
  
  return (
    <SelectItem 
      value={code}
      className="cursor-pointer py-2"
      onClick={() => onSelect(code)}
    >
      <span className="flex items-center gap-3">
        <span className="text-base flex-shrink-0">{currency.flag}</span>
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="font-medium text-sm truncate">{currency.code}</span>
          <span className="text-xs text-muted-foreground truncate">
            {currency.name} • {currency.country}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground font-mono">
            {currency.symbol}
          </span>
          {currentCurrency === code && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      </span>
    </SelectItem>
  );
};

export default CurrencySwitcher;
