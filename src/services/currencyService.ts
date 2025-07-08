// Currency conversion service with caching and fallback rates
interface ExchangeRates {
  [key: string]: number;
}

interface ConversionResult {
  convertedAmount: number;
  rate: number;
  fromCurrency: string;
  toCurrency: string;
}

const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  ZMW: 22.5,
  NGN: 1650,
  KES: 129,
  GHS: 15.8,
  UGX: 3730,
  TZS: 2500,
};

class CurrencyService {
  private exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES;
  private lastUpdated: Date | null = null;
  private cacheKey = 'currency_exchange_rates';
  private cacheTimestamp = 'currency_cache_timestamp';

  constructor() {
    this.loadCachedRates();
  }

  private loadCachedRates() {
    try {
      const cachedRates = localStorage.getItem(this.cacheKey);
      const cachedTimestamp = localStorage.getItem(this.cacheTimestamp);
      
      if (cachedRates && cachedTimestamp) {
        const timestamp = new Date(cachedTimestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        
        // Use cached rates if they're less than 24 hours old
        if (hoursDiff < 24) {
          this.exchangeRates = { ...DEFAULT_EXCHANGE_RATES, ...JSON.parse(cachedRates) };
          this.lastUpdated = timestamp;
          console.info('Using cached exchange rates:', this.exchangeRates);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached exchange rates:', error);
    }
    
    // Fallback to default rates
    console.info('Using fallback exchange rates');
    this.exchangeRates = DEFAULT_EXCHANGE_RATES;
    this.cacheRates();
  }

  private cacheRates() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.exchangeRates));
      localStorage.setItem(this.cacheTimestamp, new Date().toISOString());
      console.info('Cached exchange rates:', this.exchangeRates);
    } catch (error) {
      console.warn('Failed to cache exchange rates:', error);
    }
  }

  async updateExchangeRates(): Promise<void> {
    try {
      // In a real app, you would fetch from a currency API
      // For now, we'll use the default rates
      this.exchangeRates = DEFAULT_EXCHANGE_RATES;
      this.lastUpdated = new Date();
      this.cacheRates();
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      // Keep using cached or default rates
    }
  }

  async getExchangeRates(): Promise<ExchangeRates> {
    return this.exchangeRates;
  }

  async detectUserCurrency(): Promise<string> {
    try {
      // Try to detect from browser locale
      const locale = navigator.language;
      const currencyMap: { [key: string]: string } = {
        'en-US': 'USD',
        'en-GB': 'GBP',
        'de': 'EUR',
        'fr': 'EUR',
        'es': 'EUR',
        'it': 'EUR',
        'zh': 'USD',
        'ja': 'USD',
      };
      
      return currencyMap[locale] || 'USD';
    } catch (error) {
      console.warn('Failed to detect user currency:', error);
      return 'USD';
    }
  }

  async convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = this.exchangeRates[fromCurrency] || 1;
    const toRate = this.exchangeRates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    return Math.round(convertedAmount * 100) / 100;
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<ConversionResult> {
    const convertedAmount = await this.convertPrice(amount, fromCurrency, toCurrency);
    const rate = this.exchangeRates[toCurrency] / this.exchangeRates[fromCurrency];
    
    return {
      convertedAmount,
      rate,
      fromCurrency,
      toCurrency
    };
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = this.exchangeRates[fromCurrency] || 1;
    const toRate = this.exchangeRates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    return Math.round(convertedAmount * 100) / 100;
  }

  formatCurrency(amount: number, currency: string): string {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ZMW: 'ZK',
      NGN: '₦',
      KES: 'KSh',
      GHS: '₵',
      UGX: 'USh',
      TZS: 'TSh',
    };

    const symbol = symbols[currency] || currency;
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol}${formattedAmount}`;
  }

  formatPrice(amount: number, currency: string): string {
    return this.formatCurrency(amount, currency);
  }

  getSupportedCurrencies(): string[] {
    return Object.keys(this.exchangeRates);
  }

  getExchangeRate(currency: string): number {
    return this.exchangeRates[currency] || 1;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }
}

export const currencyService = new CurrencyService();
export default currencyService;
