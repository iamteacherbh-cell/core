'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MicrosoftLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // إذا كان المستخدم مسجل الدخول بالفعل، قم بتوجيهه
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/'); // أو أي صفحة تريدها بعد تسجيل الدخول
    }
  }, [session, status, router]);

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // تسجيل الدخول عبر Microsoft
      const result = await signIn('azure-ad', { 
        callbackUrl: '/', // بعد النجاح يذهب إلى الصفحة الرئيسية
        redirect: true 
      });
      
      console.log('Login result:', result);
    } catch (err) {
      console.error('Microsoft login error:', err);
      setError('حدث خطأ أثناء محاولة تسجيل الدخول');
      setLoading(false);
    }
  };

  // عرض شاشة تحميل أثناء التحقق من الجلسة
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        {/* شعار Microsoft */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4zM11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24z"/>
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
          تسجيل الدخول عبر Microsoft
        </h1>
        <p className="text-center text-gray-600 mb-8">
          استخدم حساب Microsoft الخاص بك للدخول
        </p>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center border border-red-200">
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
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4zM11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24z"/>
            </svg>
            تسجيل الدخول بحساب Microsoft
          </button>
        )}
        
        {/* رابط للعودة */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            ← العودة إلى الصفحة السابقة
          </button>
        </div>
      </div>
    </div>
  );
}
