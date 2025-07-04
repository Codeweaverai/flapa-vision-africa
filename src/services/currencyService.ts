
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

    try {
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data && data.rates) {
        this.exchangeRates = data.rates;
        this.lastFetchTime = now;
        console.log('Fetched exchange rates from Supabase:', this.exchangeRates);
        return this.exchangeRates;
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rates from Supabase:', error);
    }

    // Fallback to hardcoded rates
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

  getSupportedCurrencies(): string[] {
    return [...SUPPORTED_CURRENCIES];
  }

  formatCurrency(amount: number, currency: string): string {
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
}

export const currencyService = CurrencyService.getInstance();
