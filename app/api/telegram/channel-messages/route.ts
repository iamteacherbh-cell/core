import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // المساعد الذي أنشأناه

// إنشاء عميل Supabase للخادم
const supabase = createClient();

export async function GET(request: NextRequest) {
  try {
    // 1. التحقق من هوية المستخدم
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. جلب جميع رسائل القناة من قاعدة البيانات
    // نرتب الرسائل من الأحدث إلى الأقدم لعرضها بشكل صحيح
    const { data, error } = await supabase
      .from('channel_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching channel messages:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch messages from database.' }, { status: 500 });
    }

    // 3. إرجاع قائمة الرسائل
    return NextResponse.json({
      success: true,
      messages: data || []
    });

  } catch (error: any) {
    console.error('An unexpected error occurred in /api/telegram/channel-messages:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}
