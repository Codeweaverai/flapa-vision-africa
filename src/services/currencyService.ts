
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
      console.log(`Fetching exchange rates with base currency: ${baseCurrency}`);
      const response = await fetch(`${EXCHANGE_API_BASE}/${EXCHANGE_API_KEY}/latest/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();
      
      if (data.result !== 'success') {
        throw new Error('Failed to fetch exchange rates');
      }

      console.log('Fetched exchange rates:', data.conversion_rates);
      this.exchangeRates = data.conversion_rates;
      this.lastUpdate = Date.now();
      
      return this.exchangeRates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return fallback rates with some common currencies if API fails
      if (Object.keys(this.exchangeRates).length === 0) {
        this.exchangeRates = {
          'USD': 1,
          'EUR': 0.85,
          'GBP': 0.73,
          'ZMW': 27.5, // Zambian Kwacha - approximate rate
          'CAD': 1.35,
          'AUD': 1.55,
          'JPY': 150,
          'CHF': 0.88,
          'CNY': 7.25
        };
        console.log('Using fallback exchange rates:', this.exchangeRates);
      }
      return this.exchangeRates;
    }
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    // Check if cache is still valid
    if (Date.now() - this.lastUpdate < this.CACHE_DURATION && Object.keys(this.exchangeRates).length > 0) {
      console.log('Using cached exchange rates:', this.exchangeRates);
      return this.exchangeRates;
    }

    return await this.fetchExchangeRates();
  }

  async convertPrice(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): Promise<number> {
    console.log(`Converting ${amount} from ${fromCurrency} to ${toCurrency}`);
    
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();
    console.log('Available rates:', rates);
    
    // Convert to USD first if fromCurrency is not USD
    let usdAmount = amount;
    if (fromCurrency !== 'USD') {
      const fromRate = rates[fromCurrency];
      if (!fromRate) {
        console.warn(`Exchange rate not found for ${fromCurrency}, using original amount`);
        return amount;
      }
      usdAmount = amount / fromRate;
      console.log(`Converted to USD: ${usdAmount}`);
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

    const convertedAmount = usdAmount * toRate;
    console.log(`Final converted amount: ${convertedAmount} ${toCurrency}`);
    return convertedAmount;
  }

  async detectUserCurrency(): Promise<CurrencyCode> {
    try {
      // Try to get user's location from IP
      const response = await fetch('https://ipapi.co/json/');
      const data: IPLocationResponse = await response.json();
      
      const countryCode = data.countryCode;
      const currency = COUNTRY_TO_CURRENCY[countryCode];
      
      console.log(`Detected country: ${countryCode}, currency: ${currency}`);
      
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
