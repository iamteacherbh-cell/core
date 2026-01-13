import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  // نقلنا السطر إلى هنا، داخل الدالة
  const supabase = createSupabaseServerClient(); 
  try {
    // 1. التحقق من هوية المستخدم
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: إضافة تحقق إضافي للتأكد من أن المستخدم هو "أدمن"
    // const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    // if (!profile?.is_admin) {
    //   return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    // }

    // 2. جلب المستخدمين المرتبطين بـ Telegram
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('telegram_chat_id', 'is', null)
      .order('last_message_sent_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching Telegram users:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch users from database.' }, { status: 500 });
    }

    // 3. إرجاع قائمة المستخدمين
    return NextResponse.json({
      success: true,
      users: data || []
    });

  } catch (error: any) {
    console.error('An unexpected error occurred in /api/telegram/users:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}


