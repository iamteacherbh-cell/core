'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LogoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('جاري تسجيل الخروج...');

  useEffect(() => {
    const performLogout = async () => {
      try {
        // 1. تسجيل الخروج من NextAuth
        await signOut({ 
          redirect: false, // لا نريد التوجيه التلقائي حتى نتحكم بأنفسنا
        });
        
        setMessage('تم تسجيل الخروج بنجاح. جاري التوجيه...');
        
        // 2. توجيه المستخدم إلى صفحة الدخول PHP
        setTimeout(() => {
          window.location.href = 'http://jobsboard.mywebcommunity.org/login.php?logout=1';
        }, 1500);
        
      } catch (error) {
        console.error('Logout error:', error);
        setMessage('حدث خطأ أثناء تسجيل الخروج');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    };
    
    if (status !== 'loading') {
      performLogout();
    }
  }, [router, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 text-center">
        <div className="mb-6">
          <svg className="w-20 h-20 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">تسجيل الخروج</h1>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">{message}</p>
        </div>
        <Link 
          href="http://jobsboard.mywebcommunity.org/login.php"
          className="text-blue-600 hover:underline text-sm"
        >
          العودة إلى صفحة تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
