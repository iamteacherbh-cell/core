import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MicrosoftLoginButton from './MicrosoftLoginButton';

export const dynamic = 'force-dynamic';

export default async function MicrosoftLoginPage() {
  const session = await getServerSession(authOptions);

  // إذا كان المستخدم مسجلاً بالفعل، انتقل إلى الصفحة الرئيسية
  if (session) {
    redirect('/');
  }

  return <MicrosoftLoginButton />;
}
