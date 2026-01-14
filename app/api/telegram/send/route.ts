import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js'; // استيراد للعميل الإداري

export async function POST(request: NextRequest) {
  // إنشاء عميل Supabase للتحقق من هوية المستخدم الحالي
  const supabase =  await createClient();
  
  try {
    // 1. التحقق من هوية المستخدم (يجب أن يكون أدمن أو مستخدم مسجل دخول)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. جلب البيانات من جسم الطلب
    const { telegram_chat_id, message } = await request.json();

    if (!telegram_chat_id || !message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Invalid request: telegram_chat_id and message are required.' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not configured in environment variables.');
      return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
    }

    // 3. إرسال الرسالة عبر Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegram_chat_id,
        text: message.trim(),
        parse_mode: 'HTML', // يمكنك استخدام 'Markdown' أو 'HTML' لتنسيق الرسائل
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error('Telegram API error:', telegramData);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to send message via Telegram: ${telegramData.description}` 
      }, { status: 400 });
    }

    // 4. حفظ الرسالة في قاعدة البيانات (مهم جداً لعمل Real-time)
    // نستخدم service_role_key للبحث عن أي مستخدم وحفظ الرسالة
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // أولاً، ابحث عن user_id المرتبط بـ telegram_chat_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_chat_id', telegram_chat_id)
      .single();

    if (profileError || !profile) {
      // هذا يعني أن المستخدم غير موجود في قاعدة البيانات، لكن الرسالة وصلت لتليجرام
      console.error('Could not find user profile for telegram_chat_id:', telegram_chat_id);
      // لا نعيد خطأ للواجهة الأمامية لأن المهمة الأساسية (الإرسال لتليجرام) نجحت
    } else {
      // ثانياً، إذا وجدنا المستخدم، قم بإدراج الرسالة
      const { error: insertError } = await supabaseAdmin
        .from('messages')
        .insert({
          user_id: profile.id,
          content: message.trim(),
          role: 'admin',
          telegram_chat_id: telegram_chat_id,
          sender_name: 'Admin via Telegram',
        });

      if (insertError) {
        console.error('Error saving admin message to database:', insertError);
        // هذا خطأ، لأن المستخدم لن يرى الرسالة في واجهته
        return NextResponse.json({ 
          success: false, 
          error: 'Message sent to Telegram but failed to save to chat history.' 
        }, { status: 500 });
      }
    }

    // 5. إرجاع رد ناجح
    return NextResponse.json({
      success: true,
      message_id: telegramData.result.message_id, // إرجاع معرف الرسالة من تليجرام
    });

  } catch (error: any) {
    console.error('An unexpected error occurred in /api/telegram/send:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}

