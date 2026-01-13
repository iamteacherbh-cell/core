import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

// إنشاء عميل Supabase للخادم
const supabase = createSupabaseServerClient();

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق من هوية المستخدم
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. جلب البيانات من جسم الطلب
    const { message, session_id } = await request.json();

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
    }

    // 3. حفظ رسالة المستخدم في قاعدة البيانات
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: userMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: user.id,
        content: message.trim(),
        role: 'user',
        session_id: session_id || null,
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return NextResponse.json({ success: false, error: 'Failed to save your message.' }, { status: 500 });
    }

    // 4. (اختياري) يمكنك هنا إرسال إشعار للأدمن أو حفظ رسالة نظام
    // مثال: إرسال رسالة شكر عام للمستخدم
    const { error: thankYouMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: user.id,
        content: 'شكراً لرسالتك، سيتم الرد عليك في أقرب وقت ممكن.',
        role: 'assistant', // نستخدم دور المساعد كرسالة نظام
        session_id: session_id || null,
      });

    if (thankYouMessageError) {
      console.error('Error saving thank you message:', thankYouMessageError);
      // لا نعيد خطأ هنا لأن الرسالة الأساسية تم حفظها
    }

    // 5. إرجاع رد ناجح
    return NextResponse.json({
      success: true,
      response: 'شكراً لرسالتك، سيتم الرد عليك في أقرب وقت ممكن.',
    });

  } catch (error: any) {
    console.error('An unexpected error occurred in /api/ai/chat:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}
