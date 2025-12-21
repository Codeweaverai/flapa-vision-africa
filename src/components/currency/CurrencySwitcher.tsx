import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ReactCountryFlag from "react-country-flag";
import { SUPPORTED_CURRENCIES, CurrencyCode, COUNTRY_TO_CURRENCY } from '@/constants/currencies';
import { currencyService } from '@/services/currencyService';
import { toast } from 'sonner';
import { Loader2, Globe, Check, ChevronDown, Sparkles, MapPin } from 'lucide-react';

// Enhanced country code mapping for flags with fallbacks
const CURRENCY_TO_COUNTRY: Record<CurrencyCode, string> = {
  USD: 'US',
  EUR: 'FR', // Using France as primary Euro country
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

  // Get country code for currency
  const getCountryCode = (currencyCode: CurrencyCode): string => {
    return CURRENCY_TO_COUNTRY[currencyCode] || 'US'; // Fallback to US
  };

  // Get primary country name (for multi-country currencies)
  const getPrimaryCountry = (currencyCode: CurrencyCode): string => {
    const currency = SUPPORTED_CURRENCIES[currencyCode];
    return currency?.country.split('/')[0] || currency?.country || 'Unknown';
  };

  // Group currencies by region for better organization
  const majorCurrencies = ['USD', 'EUR', 'GBP'] as CurrencyCode[];
  const africanCurrencies = Object.keys(SUPPORTED_CURRENCIES)
    .filter(code => !majorCurrencies.includes(code as CurrencyCode))
    .map(code => code as CurrencyCode);

  // Show loading state while context is initializing or saving
  const showLoading = contextLoading || saving || (!initialized && !!user);

  return (
    <Select 
      value={currentCurrency} 
      onValueChange={handleCurrencyChange}
      disabled={showLoading}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-34 h-10 text-sm border-2 border-orange-200/60 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-orange-300 transition-all duration-300 rounded-xl group">
        <SelectValue>
          <div className="flex items-center gap-3">
            {showLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            ) : (
              <>
                <div className="relative">
                  <ReactCountryFlag
                    countryCode={getCountryCode(currentCurrency)}
                    svg
                    style={{
                      width: '22px',
                      height: '16px',
                      borderRadius: '3px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      objectFit: 'cover',
                    }}
                    title={currentCurrency}
                  />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm"></div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-gray-800 text-sm leading-none">
                    {currentCurrency}
                  </span>
                  <span className="text-xs text-gray-500 leading-none mt-0.5">
                    {SUPPORTED_CURRENCIES[currentCurrency]?.symbol}
                  </span>
                </div>
              </>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:text-orange-500 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        align="end" 
        className="min-w-[320px] max-h-[480px] overflow-y-auto border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm animate-in zoom-in-95"
        position="popper"
        sideOffset={8}
      >
        {/* Header with Gradient */}
        <div className="p-4 bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Select Currency</h3>
              <p className="text-xs text-gray-500 mt-0.5">Choose your preferred currency for pricing</p>
            </div>
          </div>
        </div>

        {/* Major Currencies Section */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Global Currencies
          </p>
          <div className="space-y-2">
            {majorCurrencies.map((code) => (
              <CurrencySelectItem 
                key={code}
                code={code}
                currentCurrency={currentCurrency}
                onSelect={handleCurrencyChange}
                getCountryCode={getCountryCode}
                getPrimaryCountry={getPrimaryCountry}
                isSelected={currentCurrency === code}
              />
            ))}
          </div>
        </div>

        {/* African Currencies Section */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-orange-50/30 to-purple-50/30">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Globe className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              African Currencies
            </p>
          </div>
          <div className="space-y-2">
            {africanCurrencies.map((code) => (
              <CurrencySelectItem 
                key={code}
                code={code}
                currentCurrency={currentCurrency}
                onSelect={handleCurrencyChange}
                getCountryCode={getCountryCode}
                getPrimaryCountry={getPrimaryCountry}
                isSelected={currentCurrency === code}
              />
            ))}
          </div>
        </div>

        {/* User Detection Section */}
        {user && userCountry && (
          <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-b-2xl">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3 w-3 text-green-600" />
              <span className="text-gray-600">
                Detected from <span className="font-semibold text-green-700">{userCountry}</span>
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-8 border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => handleCurrencyChange('USD')}
            >
              Set USD
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-8 border-purple-200 text-purple-600 hover:bg-purple-50"
              onClick={() => handleCurrencyChange('EUR')}
            >
              Set EUR
            </Button>
          </div>
        </div>
      </SelectContent>
    </Select>
  );
};

// Enhanced Currency Select Item Component with ReactCountryFlag
const CurrencySelectItem: React.FC<{
  code: CurrencyCode;
  currentCurrency: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  getCountryCode: (code: CurrencyCode) => string;
  getPrimaryCountry: (code: CurrencyCode) => string;
  isSelected: boolean;
}> = ({ code, currentCurrency, onSelect, getCountryCode, getPrimaryCountry, isSelected }) => {
  const currency = SUPPORTED_CURRENCIES[code];
  const countryCode = getCountryCode(code);
  
  return (
    <SelectItem 
      value={code}
      className={`
        cursor-pointer py-3 px-4 rounded-xl transition-all duration-200 border-2 m-1
        ${isSelected 
          ? 'bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200 shadow-md' 
          : 'border-transparent hover:bg-gray-50 hover:border-gray-100 hover:shadow-sm'
        }
        focus:bg-orange-50 focus:border-orange-200
      `}
      onClick={() => onSelect(code)}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Country Flag with ReactCountryFlag */}
          <div className="relative flex-shrink-0">
            <ReactCountryFlag
              countryCode={countryCode}
              svg
              style={{
                width: '28px',
                height: '21px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                objectFit: 'cover',
              }}
              title={getPrimaryCountry(code)}
            />
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          
          {/* Currency Info */}
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div className="flex items-center gap-2 w-full">
              <span className="font-bold text-gray-800 text-sm">
                {currency.code}
              </span>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {currency.symbol}
              </span>
              {isSelected && (
                <span className="text-xs bg-gradient-to-r from-orange-500 to-purple-600 text-white px-2 py-0.5 rounded-full font-medium ml-auto">
                  Active
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate w-full">
              {currency.name}
            </div>
          </div>
        </div>
        
        {/* Country Name */}
        <div className="text-right flex-shrink-0 ml-3">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
            {getPrimaryCountry(code)}
          </span>
        </div>
      </div>
    </SelectItem>
  );
};

// Simple Button component for the quick actions
const Button: React.FC<{
  variant?: 'outline' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ variant = 'outline', size = 'md', className = '', onClick, children }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2';
  const variantClasses = {
    outline: 'border bg-transparent hover:bg-accent',
    ghost: 'border-0 hover:bg-accent',
  };
  const sizeClasses = {
    sm: 'text-xs px-3',
    md: 'text-sm px-4 py-2',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default CurrencySwitcher;
