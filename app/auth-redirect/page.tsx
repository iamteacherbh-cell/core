'use client';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function AuthRedirect() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.redirectUrl) {
      // ✅ توجيه المستخدم إلى jobsboard
      window.location.href = (session as any).redirectUrl;
    } else if (status === 'authenticated') {
      // fallback إذا ما فيه redirect
      window.location.href = '/dashboard';
    }
  }, [session, status]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>جاري التوجيه...</h2>
      <p>يرجى الانتظار...</p>
    </div>
  );
}
