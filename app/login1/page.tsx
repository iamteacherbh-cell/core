'use client';

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">تسجيل الدخول</h2>
        
        <p className="text-center text-gray-600">
          سيتم التحقق من بريدك الإلكتروني تلقائياً
        </p>

        {error === 'not_registered' && (
          <div className="bg-red-100 text-red-700 p-3 rounded text-center">
            البريد الإلكتروني غير مسجل في النظام
          </div>
        )}

        {error === 'verification_failed' && (
          <div className="bg-red-100 text-red-700 p-3 rounded text-center">
            فشل التحقق من البريد الإلكتروني
          </div>
        )}
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard1' })}
            className="w-full flex items-center justify-center gap-3 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            تسجيل الدخول عبر Google
          </button>
        </div>
      </div>
    </div>
  );
}
