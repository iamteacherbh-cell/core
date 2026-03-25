'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  // ✅ Safe destructuring مع default values
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status || 'loading';
  const router = useRouter();
  const [message, setMessage] = useState('جاري التحقق...');

  useEffect(() => {
    // ✅ انتظر حتى يتم تحميل الـ session
    if (status === 'loading') {
      setMessage('جاري التحميل...');
      return;
    }

    // ✅ إذا ما فيه تسجيل دخول، وجّه لصفحة الدخول
    if (status === 'unauthenticated') {
      setMessage('يرجى تسجيل الدخول أولاً');
      setTimeout(() => {
        router.push('/login1');
      }, 2000);
      return;
    }

    // ✅ إذا فيه session وفيه redirectUrl
    if (status === 'authenticated') {
      const redirectUrl = (session as any)?.redirectUrl;

      if (redirectUrl) {
        setMessage('جاري التوجيه إلى الموقع...');
        // توجيه خارجي
        window.location.href = redirectUrl;
      } else {
        setMessage('جاري التوجيه إلى لوحة التحكم...');
        // توجيه داخلي
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    }
  }, [session, status, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '20px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Loading Spinner */}
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem',
        }} />

        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '0.5rem',
          fontWeight: '600',
        }}>
          {message}
        </h2>

        <p style={{
          fontSize: '0.9rem',
          opacity: '0.8',
        }}>
          يرجى الانتظار...
        </p>

        {/* Status indicator */}
        {status === 'authenticated' && session?.user?.email && (
          <p style={{
            fontSize: '0.85rem',
            marginTop: '1rem',
            opacity: '0.7',
          }}>
            ✓ {session.user.email}
          </p>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
