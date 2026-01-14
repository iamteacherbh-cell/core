import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // <--- تم تصحيح المسار هنا

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient(); 
  
  try {
    // 1. التحقق من هوية المستخدم
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. التحقق من أن المستخدم هو "أدمن" (مهم جداً للأمان)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.error('Authorization error: User is not an admin.', profileError);
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    // 3. جلب المستخدمين المرتبطين بـ Telegram
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('telegram_chat_id', 'is', null)
      .order('last_message_sent_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching Telegram users:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch users from database.' }, { status: 500 });
    }

    // 4. إرجاع قائمة المستخدمين
    return NextResponse.json({
      success: true,
      users: data || []
    });

  } catch (error: any) {
    console.error('An unexpected error occurred in /api/telegram/users:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}
