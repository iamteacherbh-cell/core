'use client';

import { useState, useEffect } from 'react';
import { Globe, Search, CheckCircle, XCircle } from 'lucide-react';
import { CURRENCY_LIST, type CurrencyCode } from '@/lib/constants/currencies';
import { translations, type Language } from '@/lib/translations/domain-checker';

export function DomainChecker() {
  const [language, setLanguage] = useState<Language>('en');
  const [domain, setDomain] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const t = translations[language];

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        checkDomain();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [domain, currency, loading]);

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Language Switcher */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition flex items-center gap-2"
          >
            <Globe size={18} />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t.title}
          </h2>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>

        {/* Search Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                {t.placeholder}
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder={t.placeholder}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white placeholder-slate-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                {t.currency}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {CURRENCY_LIST.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {language === 'en' ? curr.name : curr.nameAr} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={checkDomain}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  {t.checking}
                </>
              ) : (
                <>
                  <Search size={20} />
                  {t.search}
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}

          {result && !error && (
            <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">{result.domain}</span>
                {result.available ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle size={20} />
                    <span>{t.available}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle size={20} />
                    <span>{t.notAvailable}</span>
                  </div>
                )}
              </div>

              {result.available && result.price && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-t border-slate-700">
                    <span className="text-slate-400">{t.price}:</span>
                    <span className="text-2xl font-bold text-green-400">
                      {result.price.formatted}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
                    <span className="bg-slate-800 px-3 py-1 rounded-full">
                      {t.testMode} - {t.originalPrice}: ${result.original?.price?.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
