export const CURRENCIES = {
  USD: { symbol: '$', rate: 1, name: 'US Dollar', nameAr: 'دولار أمريكي' },
  SAR: { symbol: '﷼', rate: 3.75, name: 'Saudi Riyal', nameAr: 'ريال سعودي' },
  EUR: { symbol: '€', rate: 0.92, name: 'Euro', nameAr: 'يورو' },
  GBP: { symbol: '£', rate: 0.79, name: 'British Pound', nameAr: 'جنيه إسترليني' },
  AED: { symbol: 'د.إ', rate: 3.67, name: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  KWD: { symbol: 'د.ك', rate: 0.31, name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي' },
  QAR: { symbol: '﷼', rate: 3.64, name: 'Qatari Riyal', nameAr: 'ريال قطري' },
  BHD: { symbol: '.د.ب', rate: 0.38, name: 'Bahraini Dinar', nameAr: 'دينار بحريني' }
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_LIST = Object.entries(CURRENCIES).map(([code, data]) => ({
  code: code as CurrencyCode,
  ...data
}));
