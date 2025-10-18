import { supabase } from '@/lib/supabaseClient';
import { SUPPORTED_CURRENCIES, CurrencyCode, COUNTRY_TO_CURRENCY } from '@/constants/currencies';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyServiceResult {
  convertedAmount: number;
  exchangeRate: number;
  originalAmount: number;
  originalCurrency: string;
  targetCurrency: string;
}

interface UserCurrencyPreference {
  user_id: string;
  default_currency: CurrencyCode;
  country_code?: string;
  detected_by_ip: boolean;
  ip_address?: string;
  device_currency?: string;
  created_at: string;
  updated_at: string;
}

// Fallback exchange rates (updated rates)
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  ZMW: 22.5,
  NGN: 1650,
  KES: 129,
  GHS: 15.8,
  UGX: 3730,
  TZS: 2500,
  RWF: 1300,
  XOF: 600,
  XAF: 600,
  CDF: 2500,
  MZN: 63,
  MWK: 1700,
  LSL: 18,
  SLL: 22000
};

export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: ExchangeRates = {};
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Get current exchange rates with caching
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Use cache if it's still valid
    if (now - this.lastFetchTime < this.CACHE_DURATION && Object.keys(this.exchangeRates).length > 0) {
      console.log('Using cached exchange rates:', this.exchangeRates);
      return this.exchangeRates;
    }

    // Since exchange_rates table doesn't exist, use fallback rates
    console.log('Using fallback exchange rates');
    this.exchangeRates = { ...FALLBACK_RATES };
    this.lastFetchTime = now;
    return this.exchangeRates;
  }

  /**
   * Convert currency with full validation and error handling
   */
  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<CurrencyServiceResult> {
    console.log(`Converting ${amount} from ${fromCurrency} to ${toCurrency}`);
    
    // Validate input amount - must be positive
    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      console.error('Invalid amount for conversion:', amount);
      return {
        convertedAmount: 0,
        exchangeRate: 1,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency
      };
    }

    // If same currency, return original amount
    if (fromCurrency === toCurrency) {
      console.log('Same currency conversion, returning original amount:', amount);
      return {
        convertedAmount: amount,
        exchangeRate: 1,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency
      };
    }

    try {
      const rates = await this.getExchangeRates();
      console.log('Available rates:', rates);

      const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency];
      const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency];

      if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
        console.error(`Invalid exchange rate for ${fromCurrency} (${fromRate}) or ${toCurrency} (${toRate})`);
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      // Convert to USD first, then to target currency
      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      const exchangeRate = toRate / fromRate;

      // Ensure converted amount is positive
      const finalAmount = Math.max(convertedAmount, 0);

      console.log(`Conversion: ${amount} ${fromCurrency} = ${finalAmount} ${toCurrency} (rate: ${exchangeRate})`);

      return {
        convertedAmount: Math.round(finalAmount * 100) / 100, // Round to 2 decimal places
        exchangeRate,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency
      };
    } catch (error) {
      console.error('Currency conversion error:', error);
      
      // Return original amount as fallback
      return {
        convertedAmount: amount,
        exchangeRate: 1,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency
      };
    }
  }

  /**
   * Simplified conversion for price amounts
   */
  async convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    // Validate input before processing
    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      console.warn('convertPrice called with invalid amount:', amount);
      return 0;
    }
    
    const result = await this.convertCurrency(amount, fromCurrency, toCurrency);
    return result.convertedAmount;
  }

  /**
   * Format price with proper currency formatting
   */
  formatPrice(amount: number, currency: string): string {
    // Handle invalid amounts
    if (!Number.isFinite(amount) || amount < 0) {
      amount = 0;
    }
    
    try {
      // Use appropriate locale based on currency
      const locale = this.getLocaleForCurrency(currency);
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.warn(`Error formatting currency ${currency}:`, error);
      // Fallback formatting
      const currencyInfo = SUPPORTED_CURRENCIES[currency as CurrencyCode];
      if (currencyInfo) {
        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
      }
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Alias for formatPrice for backward compatibility
   */
  formatCurrency(amount: number, currency: string): string {
    return this.formatPrice(amount, currency);
  }

  /**
   * Get supported currencies as array
   */
  getSupportedCurrencies(): string[] {
    return Object.keys(SUPPORTED_CURRENCIES);
  }

  /**
   * Get supported currencies with full details
   */
  getSupportedCurrenciesWithDetails(): typeof SUPPORTED_CURRENCIES {
    return SUPPORTED_CURRENCIES;
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency: string): currency is CurrencyCode {
    return currency in SUPPORTED_CURRENCIES;
  }

  /**
   * Detect user currency with enhanced IP and browser info
   */
  async detectUserCurrency(): Promise<CurrencyCode> {
    try {
      // Try IP-based detection first
      const response = await fetch('https://ipapi.co/json/');
      const ipData = await response.json();
      
      const countryCode = ipData?.country_code;
      const currencyFromIP = COUNTRY_TO_CURRENCY[countryCode];
      
      if (currencyFromIP && SUPPORTED_CURRENCIES[currencyFromIP]) {
        console.log(`Detected currency from IP (${countryCode}):`, currencyFromIP);
        return currencyFromIP;
      }
    } catch (error) {
      console.log('IP-based currency detection failed, using browser detection');
    }

    // Fallback to browser locale detection
    try {
      const locale = navigator.language || 'en-US';
      const country = locale.split('-')[1];
      const currencyFromLocale = COUNTRY_TO_CURRENCY[country];
      
      if (currencyFromLocale && SUPPORTED_CURRENCIES[currencyFromLocale]) {
        console.log(`Detected currency from browser locale (${country}):`, currencyFromLocale);
        return currencyFromLocale;
      }
    } catch (error) {
      console.log('Browser locale detection failed');
    }

    console.log('Using default currency: USD');
    return 'USD';
  }

  /**
   * Get user's currency preference from database
   */
  async getUserCurrencyPreference(userId: string): Promise<CurrencyCode> {
    try {
      const { data, error } = await supabase
        .from('user_currency_preferences')
        .select('default_currency')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No currency preference found for user, creating default');
          await this.createDefaultUserCurrencyPreference(userId);
          return 'USD';
        }
        throw error;
      }

      const currency = data?.default_currency as CurrencyCode;
      if (!this.isCurrencySupported(currency)) {
        console.warn(`User has unsupported currency preference: ${currency}, resetting to USD`);
        await this.updateUserCurrencyPreference(userId, 'USD');
        return 'USD';
      }

      return currency;
    } catch (error) {
      console.error('Error getting user currency preference:', error);
      return 'USD';
    }
  }

  /**
   * Update user's currency preference in database
   */
  async updateUserCurrencyPreference(userId: string, currency: CurrencyCode): Promise<void> {
    try {
      if (!this.isCurrencySupported(currency)) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      const { error } = await supabase
        .from('user_currency_preferences')
        .upsert({
          user_id: userId,
          default_currency: currency,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      console.log(`Updated currency preference for user ${userId}: ${currency}`);
    } catch (error) {
      console.error('Error updating user currency preference:', error);
      throw error;
    }
  }

  /**
   * Create default currency preference for user
   */
  async createDefaultUserCurrencyPreference(userId: string): Promise<void> {
    try {
      const detectedCurrency = await this.detectUserCurrency();
      
      let ipData = null;
      try {
        const response = await fetch('https://ipapi.co/json/');
        ipData = await response.json();
      } catch (ipError) {
        console.log('Could not fetch IP data for currency detection');
      }

      const { error } = await supabase
        .from('user_currency_preferences')
        .insert({
          user_id: userId,
          default_currency: detectedCurrency,
          country_code: ipData?.country_code || null,
          detected_by_ip: !!ipData?.country_code,
          ip_address: ipData?.ip || null,
          device_currency: detectedCurrency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`Created default currency preference for user ${userId}: ${detectedCurrency}`);
    } catch (error) {
      console.error('Error creating default currency preference:', error);
      throw error;
    }
  }

  /**
   * Get user's full currency preference data
   */
  async getUserCurrencyPreferenceFull(userId: string): Promise<UserCurrencyPreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_currency_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as UserCurrencyPreference;
    } catch (error) {
      console.error('Error getting full user currency preference:', error);
      return null;
    }
  }

  /**
   * Get appropriate locale for currency formatting
   */
  private getLocaleForCurrency(currency: string): string {
    const localeMap: Record<string, string> = {
      'USD': 'en-US',
      'GBP': 'en-GB',
      'EUR': 'de-DE', // Germany uses Euro
      'ZMW': 'en-ZM',
      'NGN': 'en-NG',
      'GHS': 'en-GH',
      'KES': 'en-KE',
      'UGX': 'en-UG',
      'TZS': 'en-TZ',
      'RWF': 'en-RW',
      'XOF': 'fr-SN',
      'XAF': 'fr-CM',
      'CDF': 'fr-CD',
      'MZN': 'pt-MZ',
      'MWK': 'en-MW',
      'LSL': 'en-LS',
      'SLL': 'en-SL'
    };

    return localeMap[currency] || 'en-US';
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency as CurrencyCode];
    return currencyInfo?.symbol || currency;
  }

  /**
   * Get currency name
   */
  getCurrencyName(currency: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency as CurrencyCode];
    return currencyInfo?.name || currency;
  }

  /**
   * Get currency flag
   */
  getCurrencyFlag(currency: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency as CurrencyCode];
    return currencyInfo?.flag || '💵';
  }

  /**
   * Get currency country
   */
  getCurrencyCountry(currency: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency as CurrencyCode];
    return currencyInfo?.country || 'Unknown';
  }

  /**
   * Validate currency code
   */
  validateCurrency(currency: string): boolean {
    return this.isCurrencySupported(currency);
  }

  /**
   * Get all currency codes
   */
  getAllCurrencyCodes(): CurrencyCode[] {
    return Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[];
  }

  /**
   * Get currencies by region
   */
  getCurrenciesByRegion(): { major: CurrencyCode[]; african: CurrencyCode[] } {
    const majorCurrencies = ['USD', 'EUR', 'GBP'] as CurrencyCode[];
    const africanCurrencies = this.getAllCurrencyCodes().filter(
      code => !majorCurrencies.includes(code)
    );

    return {
      major: majorCurrencies,
      african: africanCurrencies
    };
  }

  /**
   * Refresh exchange rates cache
   */
  async refreshExchangeRates(): Promise<void> {
    this.lastFetchTime = 0;
    await this.getExchangeRates();
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { isCached: boolean; lastFetchTime: number; cacheDuration: number } {
    const now = Date.now();
    const isCached = now - this.lastFetchTime < this.CACHE_DURATION && Object.keys(this.exchangeRates).length > 0;
    
    return {
      isCached,
      lastFetchTime: this.lastFetchTime,
      cacheDuration: this.CACHE_DURATION
    };
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();
