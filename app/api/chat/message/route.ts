import { createSupabaseServerClient } from "@/lib/supabase/server" // <-- تم تصحيح اسم الدالة
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient() // <-- تم إزالة await لأن الدالة ليست async
    
    const { sessionId, userId, content } = await request.json()

    if (!sessionId || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields: sessionId, userId, content' }, { status: 400 })
    }

    // 1. حفظ رسالة المستخدم
    const { data: userMessage, error: userError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        content: content,
        role: 'user',
      })
      .select()
      .single()

    if (userError) {
      console.error("Error saving user message:", userError)
      throw userError
    }

    // 2. تحديث وقت آخر رسالة في الجلسة
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId)

    // 3. (اختياري) استدعاء الذكاء الاصطناعي للحصول على رد
    // TODO: قم باستدعاء API الذكاء الاصطناعي هنا
    // const aiResponse = await callYourAI(content);
    // const assistantReply = aiResponse.content;
    const assistantReply = "هذا رد وهمي من الذكاء الاصطناعي."; // رد مؤقت

    // 4. حفظ رد الذكاء الاصطناعي
    const { data: assistantMessage, error: assistantError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userId, // يمكن تخصيص هذا لمعرف المستخدم المساعد
        content: assistantReply,
        role: 'assistant',
      })
      .select()
      .single()

    if (assistantError) {
      console.error("Error saving assistant message:", assistantError)
      throw assistantError
    }

    // 5. إرجاع الرسائل المحفوظة إلى الواجهة الأمامية
    return NextResponse.json({ 
      success: true,
      userMessage: userMessage,
      assistantMessage: assistantMessage 
    })

  } catch (error: any) {
    console.error("[CHAT_MESSAGE_API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
