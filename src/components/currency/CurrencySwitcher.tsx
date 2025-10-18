import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { SUPPORTED_CURRENCIES, CurrencyCode, COUNTRY_TO_CURRENCY } from '@/constants/currencies';
import { currencyService } from '@/services/currencyService';
import { toast } from 'sonner';
import { Loader2, Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

// Country code mapping for flags
const CURRENCY_TO_COUNTRY: Record<CurrencyCode, string> = {
  USD: 'US',
  EUR: 'EU', // European Union
  GBP: 'GB',
  ZMW: 'ZM',
  NGN: 'NG',
  GHS: 'GH',
  KES: 'KE',
  UGX: 'UG',
  TZS: 'TZ',
  RWF: 'RW',
  XOF: 'SN', // Senegal (primary XOF country)
  XAF: 'CM', // Cameroon (primary XAF country)
  CDF: 'CD',
  MZN: 'MZ',
  MWK: 'MW',
  LSL: 'LS',
  SLL: 'SL',
};

const CurrencySwitcher: React.FC = () => {
  const { currentCurrency, setCurrency, isLoading: contextLoading } = useCurrency();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load user's currency preference from database and sync with context
  useEffect(() => {
    const loadUserCurrencyPreference = async () => {
      if (!user) {
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
          ip_address: null,
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
      setIsOpen(false);
    }
  };

  // Get flag emoji or CDN flag URL
  const getFlag = (currencyCode: CurrencyCode) => {
    const countryCode = CURRENCY_TO_COUNTRY[currencyCode];
    
    // Option 1: Use emoji flags (no dependencies)
    if (countryCode && countryCode.length === 2) {
      return String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1F1A5 + c.charCodeAt(0)));
    }
    
    // Option 2: Use CDN flags (uncomment if you prefer this approach)
    // return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
    
    // Fallback to currency emoji
    return SUPPORTED_CURRENCIES[currencyCode]?.flag || '💵';
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
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-32 h-9 text-sm border-2 border-orange-200/50 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-orange-300 transition-all duration-300 rounded-xl">
        <SelectValue>
          <div className="flex items-center gap-2">
            {showLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            ) : (
              <>
                <span className="text-lg">{getFlag(currentCurrency)}</span>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-800 text-sm leading-none">
                    {currentCurrency}
                  </span>
                  <span className="text-xs text-gray-500 leading-none mt-0.5">
                    {SUPPORTED_CURRENCIES[currentCurrency]?.symbol}
                  </span>
                </div>
              </>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        align="end" 
        className="min-w-[280px] max-h-[400px] overflow-y-auto border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm"
        position="popper"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Select Currency</h3>
              <p className="text-xs text-gray-500">Choose your preferred currency</p>
            </div>
          </div>
        </div>

        {/* Major Currencies Section */}
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Global Currencies
          </p>
          <div className="space-y-1">
            {majorCurrencies.map((code) => (
              <CurrencySelectItem 
                key={code}
                code={code}
                currentCurrency={currentCurrency}
                onSelect={handleCurrencyChange}
                getFlag={getFlag}
                isSelected={currentCurrency === code}
              />
            ))}
          </div>
        </div>

        {/* African Currencies Section */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Globe className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              African Currencies
            </p>
          </div>
          <div className="space-y-1">
            {africanCurrencies.map((code) => (
              <CurrencySelectItem 
                key={code}
                code={code}
                currentCurrency={currentCurrency}
                onSelect={handleCurrencyChange}
                getFlag={getFlag}
                isSelected={currentCurrency === code}
              />
            ))}
          </div>
        </div>

        {/* User Info Section */}
        {user && userCountry && (
          <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-orange-50 to-purple-50 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-gray-600">
                Detected from <span className="font-semibold">{userCountry}</span>
              </p>
            </div>
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

// Enhanced Currency Select Item Component
const CurrencySelectItem: React.FC<{
  code: CurrencyCode;
  currentCurrency: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  getFlag: (code: CurrencyCode) => string;
  isSelected: boolean;
}> = ({ code, currentCurrency, onSelect, getFlag, isSelected }) => {
  const currency = SUPPORTED_CURRENCIES[code];
  
  return (
    <SelectItem 
      value={code}
      className={`
        cursor-pointer py-3 px-4 rounded-xl transition-all duration-200 border-2
        ${isSelected 
          ? 'bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200 shadow-sm' 
          : 'border-transparent hover:bg-gray-50 hover:border-gray-100'
        }
      `}
      onClick={() => onSelect(code)}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Flag */}
          <span className="text-2xl flex-shrink-0">{getFlag(code)}</span>
          
          {/* Currency Info */}
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div className="flex items-center gap-2 w-full">
              <span className="font-semibold text-gray-800 text-sm truncate">
                {currency.code}
              </span>
              {isSelected && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-2 py-0.5 rounded-full">
                  <Check className="h-3 w-3" />
                  <span className="text-xs font-medium">Active</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span className="font-mono">{currency.symbol}</span>
              <span className="truncate">{currency.name}</span>
            </div>
          </div>
        </div>
        
        {/* Country Name */}
        <div className="text-right flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium">
            {currency.country.split('/')[0]} {/* Show primary country */}
          </span>
        </div>
      </div>
    </SelectItem>
  );
};

export default CurrencySwitcher;
