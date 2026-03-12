'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login1Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // تهيئة Google مرة واحدة فقط
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '230767338362-hfnru5m4neg261iqp20jc0hs7tkvu3hm.apps.googleusercontent.com',
          callback: handleGoogleResponse
        });
      } else {
        // تحميل المكتبة إذا لم تكن موجودة
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          window.google.accounts.id.initialize({
            client_id: '230767338362-hfnru5m4neg261iqp20jc0hs7tkvu3hm.apps.googleusercontent.com',
            callback: handleGoogleResponse
          });
        };
        document.body.appendChild(script);
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    setLoading(true);
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      setError('جاري تحميل مكتبة Google...');
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      const data = JSON.parse(atob(response.credential.split('.')[1]));
      
      // ✅ استخدام API Route الداخلي (بدون مشاكل Mixed Content)
      const verifyResponse = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          provider: 'google'
        })
      });
      
      const result = await verifyResponse.json();
      
    if (result.success) {
  // ✅ التوجيه إلى login.php أولاً (سيسجل الدخول تلقائياً)
  window.location.href = 'http://jobsboard.mywebcommunity.org/login.php?email=' + encodeURIComponent(data.email);
}
 else {
        setError('البريد الإلكتروني غير مسجل في النظام');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('فشل الاتصال بخادم التحقق');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-3xl font-bold text-center mb-8">تسجيل الدخول عبر Google</h1>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4">جاري التحقق من البريد الإلكتروني...</p>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            تسجيل الدخول عبر Google
          </button>
        )}
        
        <p className="text-sm text-gray-500 text-center mt-4">
          سيتم التحقق من بريدك الإلكتروني في نظامنا
        </p>
      </div>
    </div>
  );
}
