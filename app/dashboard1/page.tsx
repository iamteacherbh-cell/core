import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">workshub.space</h1>
          <a href="/api/auth/signout" className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            تسجيل خروج
          </a>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl mb-4">مرحباً {session.user?.name} 👋</h2>
          <p className="text-gray-600">البريد الإلكتروني: {session.user?.email}</p>
          <p className="text-green-600 mt-4">✅ تم التحقق من بريدك الإلكتروني بنجاح</p>
        </div>
      </main>
    </div>
  );
}
