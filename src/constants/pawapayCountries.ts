
export const PAWAPAY_COUNTRY_CODES = {
  'Zambia': { code: 'ZMB', flag: '🇿🇲', dialCode: '+260' },
  'Kenya': { code: 'KEN', flag: '🇰🇪', dialCode: '+254' },
  'Uganda': { code: 'UGA', flag: '🇺🇬', dialCode: '+256' },
  'Tanzania': { code: 'TZA', flag: '🇹🇿', dialCode: '+255' },
  'Ghana': { code: 'GHA', flag: '🇬🇭', dialCode: '+233' },
  'Nigeria': { code: 'NGA', flag: '🇳🇬', dialCode: '+234' },
  'Rwanda': { code: 'RWA', flag: '🇷🇼', dialCode: '+250' },
  'Malawi': { code: 'MWI', flag: '🇲🇼', dialCode: '+265' },
  'Mozambique': { code: 'MOZ', flag: '🇲🇿', dialCode: '+258' },
  'Senegal': { code: 'SEN', flag: '🇸🇳', dialCode: '+221' },
  'Benin': { code: 'BEN', flag: '🇧🇯', dialCode: '+229' },
  'Burkina Faso': { code: 'BFA', flag: '🇧🇫', dialCode: '+226' },
  'Cameroon': { code: 'CMR', flag: '🇨🇲', dialCode: '+237' },
  'Congo-Brazzaville': { code: 'COG', flag: '🇨🇬', dialCode: '+242' },
  'DRC': { code: 'COD', flag: '🇨🇩', dialCode: '+243' },
  'Gabon': { code: 'GAB', flag: '🇬🇦', dialCode: '+241' },
  'Ivory Coast': { code: 'CIV', flag: '🇨🇮', dialCode: '+225' },
  'Lesotho': { code: 'LSO', flag: '🇱🇸', dialCode: '+266' },
  'Sierra Leone': { code: 'SLE', flag: '🇸🇱', dialCode: '+232' },
};

export type PawapayCountryCode = keyof typeof PAWAPAY_COUNTRY_CODES;
