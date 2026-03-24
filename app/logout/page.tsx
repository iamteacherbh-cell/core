import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import LogoutClient from './LogoutClient';

export const dynamic = 'force-dynamic';

export default async function LogoutPage() {
  const session = await getServerSession(authOptions);
  
  // إذا لم يكن هناك جلسة، قم بتوجيه المستخدم مباشرة إلى login.php
  if (!session) {
    redirect('http://jobsboard.mywebcommunity.org/login.php?logout=1');
  }
  
  // تمرير معلومات المستخدم إلى المكون العميل
  return <LogoutClient userEmail={session.user?.email} />;
}
