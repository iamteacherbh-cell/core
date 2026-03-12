// app/dashboard1/page.tsx - لوحة التحكم بعد تسجيل Google
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard1Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // استرجاع بيانات المستخدم من localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login1');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login1');
  };

  if (!user) return <div>جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">workshub.space</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            تسجيل خروج
          </button>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl mb-4">مرحباً {user.name} 👋</h2>
          
          <div className="bg-gray-50 p-4 rounded space-y-2">
            <p><strong>البريد الإلكتروني:</strong> {user.email}</p>
            <p><strong>اسم المستخدم:</strong> {user.username}</p>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded border border-green-200">
            ✅ تم التحقق من بريدك الإلكتروني عبر {user.provider || 'Google'}
          </div>
        </div>
      </main>
    </div>
  );
}
