
import { CurrencyCode, SUPPORTED_CURRENCIES, COUNTRY_TO_CURRENCY } from '@/constants/currencies';

const EXCHANGE_API_KEY = '3f254c124114b59798243e38';
const EXCHANGE_API_BASE = 'https://v6.exchangerate-api.com/v6';

interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface IPLocationResponse {
  country: string;
  countryCode: string;
}

class CurrencyService {
  private exchangeRates: Record<string, number> = {};
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds

  async fetchExchangeRates(baseCurrency: CurrencyCode = 'USD'): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${EXCHANGE_API_BASE}/${EXCHANGE_API_KEY}/latest/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();
      
      if (data.result !== 'success') {
        throw new Error('Failed to fetch exchange rates');
      }

      this.exchangeRates = data.conversion_rates;
      this.lastUpdate = Date.now();
      
      return this.exchangeRates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return cached rates if available, otherwise return default rates
      return this.exchangeRates;
    }
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    // Check if cache is still valid
    if (Date.now() - this.lastUpdate < this.CACHE_DURATION && Object.keys(this.exchangeRates).length > 0) {
      return this.exchangeRates;
    }

    return await this.fetchExchangeRates();
  }

  async convertPrice(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();
    
    // Convert to USD first if fromCurrency is not USD
    let usdAmount = amount;
    if (fromCurrency !== 'USD') {
      const fromRate = rates[fromCurrency];
      if (!fromRate) {
        console.warn(`Exchange rate not found for ${fromCurrency}, using original amount`);
        return amount;
      }
      usdAmount = amount / fromRate;
    }

    // Convert from USD to target currency
    if (toCurrency === 'USD') {
      return usdAmount;
    }

    const toRate = rates[toCurrency];
    if (!toRate) {
      console.warn(`Exchange rate not found for ${toCurrency}, using USD amount`);
      return usdAmount;
    }

    return usdAmount * toRate;
  }

  async detectUserCurrency(): Promise<CurrencyCode> {
    try {
      // Try to get user's location from IP
      const response = await fetch('https://ipapi.co/json/');
      const data: IPLocationResponse = await response.json();
      
      const countryCode = data.countryCode;
      const currency = COUNTRY_TO_CURRENCY[countryCode];
      
      if (currency && SUPPORTED_CURRENCIES[currency]) {
        return currency;
      }
    } catch (error) {
      console.error('Error detecting user location:', error);
    }

    // Fallback to USD
    return 'USD';
  }

  formatPrice(amount: number, currency: CurrencyCode): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo) {
      return `$${amount.toFixed(2)}`;
    }

    // Format the number with appropriate decimal places
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${currencyInfo.symbol}${formatter.format(amount)}`;
  }
}

export const currencyService = new CurrencyService();
