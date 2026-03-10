'use client';

import { useState, useEffect } from 'react';
import { Globe, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Currency configuration
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', nameAr: 'دولار أمريكي' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', nameAr: 'ريال سعودي' },
  { code: 'EUR', symbol: '€', name: 'Euro', nameAr: 'يورو' },
  { code: 'GBP', symbol: '£', name: 'British Pound', nameAr: 'جنيه إسترليني' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', nameAr: 'ريال قطري' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', nameAr: 'دينار بحريني' }
] as const;

// Suggested domains for animation
const SUGGESTED_DOMAINS = [
  'example.com', 'mysite.net', 'business.org', 'startup.io',
  'tech.dev', 'store.shop', 'blog.me', 'portfolio.design'
];

type Language = 'en' | 'ar';
type Currency = typeof CURRENCIES[number]['code'];

const translations = {
  en: {
    title: 'Domain Price Checker',
    subtitle: 'Check domain availability and prices in multiple currencies',
    placeholder: 'Enter domain name (e.g., example.com)',
    search: 'Search',
    searching: 'Searching',
    available: 'Available',
    notAvailable: 'Not Available',
    price: 'Price',
    currency: 'Currency',
    error: 'Error checking domain',
    enterDomain: 'Please enter a domain name',
    suggestions: 'Popular domains',
    viewAll: 'View all',
    popular: 'Popular'
  },
  ar: {
    title: 'فحص سعر النطاق',
    subtitle: 'تحقق من توفر النطاق والأسعار بعملات متعددة',
    placeholder: 'أدخل اسم النطاق (مثال: example.com)',
    search: 'بحث',
    searching: 'جاري البحث',
    available: 'متاح',
    notAvailable: 'غير متاح',
    price: 'السعر',
    currency: 'العملة',
    error: 'خطأ في فحص النطاق',
    enterDomain: 'الرجاء إدخال اسم النطاق',
    suggestions: 'نطاقات مقترحة',
    viewAll: 'عرض الكل',
    popular: 'شائعة'
  }
};

export function DomainChecker() {
  const [language, setLanguage] = useState<Language>('en');
  const [domain, setDomain] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{domain: string, price: string, available: boolean}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const t = translations[language];

  // Simulate suggestions while typing
  useEffect(() => {
    if (domain.length > 2) {
      setSearching(true);
      const timer = setTimeout(() => {
        // Generate suggestions based on input
        const base = domain.split('.')[0];
        const tlds = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.shop'];
        const newSuggestions = tlds.map((tld, index) => ({
          domain: `${base}${tld}`,
          price: `${CURRENCIES[currency].symbol}${(Math.random() * 20 + 5).toFixed(2)}`,
          available: Math.random() > 0.3
        }));
        setSuggestions(newSuggestions);
        setSearching(false);
        setShowSuggestions(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [domain, currency]);

  const checkDomain = async () => {
    if (!domain.trim()) {
      setError(t.enterDomain);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/check-domain?domain=${encodeURIComponent(domain)}&currency=${currency}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.error);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl relative z-10">
        {/* Language Switcher */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full hover:bg-white/10 transition flex items-center gap-2 text-sm"
          >
            <Globe size={16} />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t.title}
          </h2>
          <p className="text-slate-400 text-sm md:text-base">{t.subtitle}</p>
        </div>

        {/* Search Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-white/10">
          {/* Input Section */}
          <div className="space-y-4">
            {/* Domain Input with Suggestions */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.placeholder}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onFocus={() => domain.length > 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t.placeholder}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white placeholder-slate-500 pr-12"
                  dir="ltr"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-2 bg-slate-900/50 border-b border-slate-700">
                    <span className="text-xs text-slate-400">{t.suggestions}</span>
                  </div>
                  {suggestions.map((item, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition group"
                      onClick={() => {
                        setDomain(item.domain);
                        setShowSuggestions(false);
                        checkDomain();
                      }}
                    >
                      <span className="text-white group-hover:text-blue-400 transition">
                        {item.domain}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{item.price}</span>
                        {item.available ? (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            {t.available}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                            {t.notAvailable}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.currency}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white appearance-none cursor-pointer"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-slate-800">
                    {curr.code} - {language === 'en' ? curr.name : curr.nameAr} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={checkDomain}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.searching}...</span>
                </>
              ) : (
                <>
                  <Search size={20} className="group-hover:rotate-12 transition" />
                  {t.search}
                </>
              )}
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center animate-shake">
              {error}
            </div>
          )}

          {/* Result Display - بدون وضع التجربة */}
          {result && !error && (
            <div className="mt-8 p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-white">{result.domain}</span>
                {result.available ? (
                  <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">{t.available}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                    <XCircle size={18} />
                    <span className="text-sm font-medium">{t.notAvailable}</span>
                  </div>
                )}
              </div>

              {result.available && result.price && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-t border-slate-700">
                    <span className="text-slate-400">{t.price}:</span>
                    <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
                      {result.price.formatted}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Suggestions */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{t.popular}:</span>
              <button className="text-xs text-blue-400 hover:text-blue-300 transition">
                {t.viewAll} →
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_DOMAINS.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setDomain(suggestion);
                    checkDomain();
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}
