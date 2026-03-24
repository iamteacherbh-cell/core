import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MicrosoftLoginButton from './MicrosoftLoginButton';

export const dynamic = 'force-dynamic';

export default async function MicrosoftPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/');
  }
  return <MicrosoftLoginButton />;
}
