// src/constants/currencies.ts
export const SUPPORTED_CURRENCIES = {
  // Major Currencies
  USD: { 
    code: 'USD', 
    symbol: '$', 
    flag: '🇺🇸', 
    name: 'US Dollar', 
    country: 'United States',
    countryCode: 'US'
  },
  GBP: { 
    code: 'GBP', 
    symbol: '£', 
    flag: '🇬🇧', 
    name: 'British Pound', 
    country: 'United Kingdom',
    countryCode: 'GB'
  },
  EUR: { 
    code: 'EUR', 
    symbol: '€', 
    flag: '🇪🇺', 
    name: 'Euro', 
    country: 'European Union',
    countryCode: 'FR' // Using France as primary Euro country
  },
  
  // African Currencies
  ZMW: { 
    code: 'ZMW', 
    symbol: 'ZK', 
    flag: '🇿🇲', 
    name: 'Zambian Kwacha', 
    country: 'Zambia',
    countryCode: 'ZM'
  },
  NGN: { 
    code: 'NGN', 
    symbol: '₦', 
    flag: '🇳🇬', 
    name: 'Nigerian Naira', 
    country: 'Nigeria',
    countryCode: 'NG'
  },
  GHS: { 
    code: 'GHS', 
    symbol: '₵', 
    flag: '🇬🇭', 
    name: 'Ghanaian Cedi', 
    country: 'Ghana',
    countryCode: 'GH'
  },
  KES: { 
    code: 'KES', 
    symbol: 'KSh', 
    flag: '🇰🇪', 
    name: 'Kenyan Shilling', 
    country: 'Kenya',
    countryCode: 'KE'
  },
  UGX: { 
    code: 'UGX', 
    symbol: 'USh', 
    flag: '🇺🇬', 
    name: 'Ugandan Shilling', 
    country: 'Uganda',
    countryCode: 'UG'
  },
  TZS: { 
    code: 'TZS', 
    symbol: 'TSh', 
    flag: '🇹🇿', 
    name: 'Tanzanian Shilling', 
    country: 'Tanzania',
    countryCode: 'TZ'
  },
  RWF: { 
    code: 'RWF', 
    symbol: 'RF', 
    flag: '🇷🇼', 
    name: 'Rwandan Franc', 
    country: 'Rwanda',
    countryCode: 'RW'
  },
  XOF: { 
    code: 'XOF', 
    symbol: 'CFA', 
    flag: '🇸🇳', 
    name: 'West African CFA Franc', 
    country: 'Senegal/Benin/Burkina Faso/Ivory Coast',
    countryCode: 'SN' // Using Senegal as primary XOF country
  },
  XAF: { 
    code: 'XAF', 
    symbol: 'FCFA', 
    flag: '🇨🇲', 
    name: 'Central African CFA Franc', 
    country: 'Cameroon/Gabon/Congo',
    countryCode: 'CM' // Using Cameroon as primary XAF country
  },
  CDF: { 
    code: 'CDF', 
    symbol: 'FC', 
    flag: '🇨🇩', 
    name: 'Congolese Franc', 
    country: 'DRC',
    countryCode: 'CD'
  },
  MZN: { 
    code: 'MZN', 
    symbol: 'MT', 
    flag: '🇲🇿', 
    name: 'Mozambican Metical', 
    country: 'Mozambique',
    countryCode: 'MZ'
  },
  MWK: { 
    code: 'MWK', 
    symbol: 'MK', 
    flag: '🇲🇼', 
    name: 'Malawian Kwacha', 
    country: 'Malawi',
    countryCode: 'MW'
  },
  LSL: { 
    code: 'LSL', 
    symbol: 'L', 
    flag: '🇱🇸', 
    name: 'Lesotho Loti', 
    country: 'Lesotho',
    countryCode: 'LS'
  },
  SLL: { 
    code: 'SLL', 
    symbol: 'Le', 
    flag: '🇸🇱', 
    name: 'Sierra Leonean Leone', 
    country: 'Sierra Leone',
    countryCode: 'SL'
  },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export interface Currency {
  code: string;
  symbol: string;
  flag: string;
  name: string;
  country: string;
  countryCode: string;
}

// Country to currency mapping for IP-based detection
export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  'US': 'USD',
  'GB': 'GBP',
  'ZM': 'ZMW',
  'NG': 'NGN',
  'GH': 'GHS',
  'KE': 'KES',
  'UG': 'UGX',
  'TZ': 'TZS',
  'RW': 'RWF',
  'SN': 'XOF',
  'BJ': 'XOF',
  'BF': 'XOF',
  'CI': 'XOF',
  'CM': 'XAF',
  'GA': 'XAF',
  'CG': 'XAF',
  'CD': 'CDF',
  'MZ': 'MZN',
  'MW': 'MWK',
  'LS': 'LSL',
  'SL': 'SLL',
};

// Default currency
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

// Currency to country mapping for flag display (using primary countries)
export const CURRENCY_TO_COUNTRY: Record<CurrencyCode, string> = {
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
  XOF: 'SN', // Using Senegal as primary XOF country
  XAF: 'CM', // Using Cameroon as primary XAF country
  CDF: 'CD',
  MZN: 'MZ',
  MWK: 'MW',
  LSL: 'LS',
  SLL: 'SL',
};

// Helper function to get primary country name (for multi-country currencies)
export const getPrimaryCountry = (currencyCode: CurrencyCode): string => {
  const currency = SUPPORTED_CURRENCIES[currencyCode];
  return currency?.country.split('/')[0] || currency?.country || 'Unknown';
};

// Helper function to get country code for currency
export const getCountryCode = (currencyCode: CurrencyCode): string => {
  return CURRENCY_TO_COUNTRY[currencyCode] || 'US'; // Fallback to US
};

// Get all supported currencies with full details
export const getAllCurrencies = (): Currency[] => {
  return Object.values(SUPPORTED_CURRENCIES) as Currency[];
};

// Get currencies by region
export const getCurrenciesByRegion = (): { major: CurrencyCode[]; african: CurrencyCode[] } => {
  const majorCurrencies = ['USD', 'EUR', 'GBP'] as CurrencyCode[];
  const africanCurrencies = Object.keys(SUPPORTED_CURRENCIES)
    .filter(code => !majorCurrencies.includes(code as CurrencyCode))
    .map(code => code as CurrencyCode);

  return {
    major: majorCurrencies,
    african: africanCurrencies
  };
};

// Check if currency is supported
export const isCurrencySupported = (currency: string): currency is CurrencyCode => {
  return currency in SUPPORTED_CURRENCIES;
};

// Get currency by code
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return SUPPORTED_CURRENCIES[code as CurrencyCode];
};
