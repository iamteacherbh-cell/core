'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function MicrosoftLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('azure-ad', { callbackUrl: '/', redirect: true });
    } catch (err) {
      console.error('Microsoft login error:', err);
      setError('حدث خطأ أثناء محاولة تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4zM11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">تسجيل الدخول عبر Microsoft</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">استخدم حساب Microsoft الخاص بك للدخول إلى النظام</p>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center border border-red-200 text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التوجيه إلى Microsoft...</p>
          </div>
        ) : (
          <button
            onClick={handleMicrosoftLogin}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md hover:shadow-lg font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4zM11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24z" />
            </svg>
            تسجيل الدخول بحساب Microsoft
          </button>
        )}
        <div className="mt-6 text-center">
          <Link href="/login1" className="text-sm text-gray-500 hover:text-gray-700 transition">
            ← العودة إلى صفحة تسجيل الدخول
          </Link>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>سيتم التحقق من بريدك الإلكتروني مع النظام</p>
        </div>
      </div>
    </div>
  );
}
