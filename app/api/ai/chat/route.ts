import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // المساعد الذي أنشأناه
import OpenAI from 'openai';

// إنشاء عميل Supabase للخادم
const supabase = createClient();

// إنشاء عميل OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق من هوية المستخدم من خلال الجلسة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. جلب البيانات من جسم الطلب
    const { message, session_id } = await request.json();

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Message content is required and cannot be empty.' }, { status: 400 });
    }

    // 3. إرسال الرسالة إلى OpenAI للحصول على رد
    let aiResponse: string | null = null;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // يمكنك استخدام "gpt-4" لدقة أعلى
        messages: [
          {
            role: "system",
            content: "أنت مساعد ذكي ومفيد لمشروع iCore. إجاباتك يجب أن تكون دقيقة ومختصرة وباللغة العربية ما لم يطلب المستخدم غير ذلك."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      aiResponse = completion.choices[0].message.content;
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json({ success: false, error: 'Failed to get response from AI service.' }, { status: 500 });
    }

    if (!aiResponse) {
      return NextResponse.json({ success: false, error: 'AI service returned an empty response.' }, { status: 500 });
    }

    // 4. حفظ الرسائل في قاعدة البيانات
    // نستخدم service_role_key هنا لضمان القدرة على الكتابة
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // إدراج رسالة المستخدم
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
      // لا نعيد خطأ هنا، بل نسجل المشكلة ونستمر
    }

    // إدراج رد الذكاء الاصطناعي
    const { error: aiMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: user.id,
        content: aiResponse.trim(),
        role: 'assistant',
        session_id: session_id || null,
      });

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
      return NextResponse.json({ success: false, error: 'Failed to save the AI response.' }, { status: 500 });
    }

    // 5. إرجاع رد ناجح
    return NextResponse.json({
      success: true,
      response: aiResponse.trim(),
    });

  } catch (error: any) {
    console.error('An unexpected error occurred in /api/ai/chat:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}
