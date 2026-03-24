'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface LogoutClientProps {
  userEmail?: string | null;
  userName?: string | null;
}

export default function LogoutClient({ userEmail, userName }: LogoutClientProps) {
  const [message, setMessage] = useState('جاري تسجيل الخروج...');
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');

  useEffect(() => {
    const performLogout = async () => {
      try {
        // تسجيل الخروج من NextAuth
        await signOut({ 
          redirect: false,
          callbackUrl: '/'
        });
        
        setMessage('تم تسجيل الخروج بنجاح. جاري التوجيه...');
        
        // عد تنازلي قبل التوجيه إلى PHP
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              // التوجيه إلى صفحة تسجيل الدخول في PHP مع logout=1
              window.location.href = 'http://jobsboard.mywebcommunity.org/login.php?logout=1';
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } catch (err) {
        console.error('Logout error:', err);
        setError('حدث خطأ أثناء تسجيل الخروج');
        setMessage('فشل تسجيل الخروج');
        
        // في حالة الخطأ، توجيه مباشر بعد 2 ثانية
        setTimeout(() => {
          window.location.href = 'http://jobsboard.mywebcommunity.org/login.php';
        }, 2000);
      }
    };
    
    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 text-center">
        <div className="mb-6">
          <svg className="w-20 h-20 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        
        {userName && (
          <p className="text-sm text-gray-500 mb-2">
            {userName}
          </p>
        )}
        {userEmail && (
          <p className="text-sm text-gray-400 mb-4">
            {userEmail}
          </p>
        )}
        
        <h1 className="text-2xl font-bold mb-4">تسجيل الخروج</h1>
        
        {error ? (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">{message}</p>
            </div>
            
            {countdown < 3 && countdown > 0 && (
              <p className="text-sm text-gray-400 mb-4">
                سيتم التوجيه خلال {countdown} ثوانٍ...
              </p>
            )}
          </>
        )}
        
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
