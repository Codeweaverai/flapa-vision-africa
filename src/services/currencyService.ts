
import { supabase } from '@/lib/supabaseClient';

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

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'ZMW', 'NGN', 'KES', 'GHS', 'UGX', 'TZS'];

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
  TZS: 2500
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

  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<CurrencyServiceResult> {
    console.log(`Converting ${amount} from ${fromCurrency} to ${toCurrency}`);
    
    // Validate input amount
    if (!amount || amount <= 0) {
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

      const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
      const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;

      if (!fromRate || !toRate) {
        console.error(`Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      // Convert to USD first, then to target currency
      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      const exchangeRate = toRate / fromRate;

      console.log(`Conversion: ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency} (rate: ${exchangeRate})`);

      return {
        convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
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

  async convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const result = await this.convertCurrency(amount, fromCurrency, toCurrency);
    return result.convertedAmount;
  }

  formatPrice(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.warn(`Error formatting currency ${currency}:`, error);
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  formatCurrency(amount: number, currency: string): string {
    return this.formatPrice(amount, currency);
  }

  getSupportedCurrencies(): string[] {
    return [...SUPPORTED_CURRENCIES];
  }

  async detectUserCurrency(): Promise<string> {
    // Simple detection based on browser locale or return USD as default
    try {
      const locale = navigator.language || 'en-US';
      const country = locale.split('-')[1];
      
      // Map common countries to currencies
      const countryToCurrency: { [key: string]: string } = {
        'US': 'USD',
        'GB': 'GBP',
        'ZM': 'ZMW',
        'NG': 'NGN',
        'KE': 'KES',
        'GH': 'GHS',
        'UG': 'UGX',
        'TZ': 'TZS'
      };
      
      return countryToCurrency[country] || 'USD';
    } catch (error) {
      console.warn('Could not detect user currency:', error);
      return 'USD';
    }
  }
}

export const currencyService = CurrencyService.getInstance();
