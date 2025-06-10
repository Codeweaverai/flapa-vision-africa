
export const SUPPORTED_CURRENCIES = {
  // Major Currencies
  USD: { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar', country: 'United States' },
  GBP: { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound', country: 'United Kingdom' },
  EUR: { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro', country: 'European Union' },
  
  // African Currencies
  ZMW: { code: 'ZMW', symbol: 'ZK', flag: '🇿🇲', name: 'Zambian Kwacha', country: 'Zambia' },
  NGN: { code: 'NGN', symbol: '₦', flag: '🇳🇬', name: 'Nigerian Naira', country: 'Nigeria' },
  GHS: { code: 'GHS', symbol: '₵', flag: '🇬🇭', name: 'Ghanaian Cedi', country: 'Ghana' },
  KES: { code: 'KES', symbol: 'KSh', flag: '🇰🇪', name: 'Kenyan Shilling', country: 'Kenya' },
  UGX: { code: 'UGX', symbol: 'USh', flag: '🇺🇬', name: 'Ugandan Shilling', country: 'Uganda' },
  TZS: { code: 'TZS', symbol: 'TSh', flag: '🇹🇿', name: 'Tanzanian Shilling', country: 'Tanzania' },
  RWF: { code: 'RWF', symbol: 'RF', flag: '🇷🇼', name: 'Rwandan Franc', country: 'Rwanda' },
  XOF: { code: 'XOF', symbol: 'CFA', flag: '🇸🇳', name: 'West African CFA Franc', country: 'Senegal/Benin/Burkina Faso/Ivory Coast' },
  XAF: { code: 'XAF', symbol: 'FCFA', flag: '🇨🇲', name: 'Central African CFA Franc', country: 'Cameroon/Gabon/Congo' },
  CDF: { code: 'CDF', symbol: 'FC', flag: '🇨🇩', name: 'Congolese Franc', country: 'DRC' },
  MZN: { code: 'MZN', symbol: 'MT', flag: '🇲🇿', name: 'Mozambican Metical', country: 'Mozambique' },
  MWK: { code: 'MWK', symbol: 'MK', flag: '🇲🇼', name: 'Malawian Kwacha', country: 'Malawi' },
  LSL: { code: 'LSL', symbol: 'L', flag: '🇱🇸', name: 'Lesotho Loti', country: 'Lesotho' },
  SLL: { code: 'SLL', symbol: 'Le', flag: '🇸🇱', name: 'Sierra Leonean Leone', country: 'Sierra Leone' },
};

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export interface Currency {
  code: string;
  symbol: string;
  flag: string;
  name: string;
  country: string;
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
