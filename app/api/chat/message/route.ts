import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { sessionId, message, role } = await request.json()

    if (!sessionId || !message || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // حفظ رسالة المستخدم
    const { data: savedMessage, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        content: message,
        role: role,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving message:", error)
      throw error
    }

    // هنا يمكنك إضافة منطق الذكاء الاصطناعي إذا كان role === 'user'
    // ثم حفظ رد الذكاء الاصطناعي
    let assistantReply = null;
    if (role === 'user') {
      // TODO: قم باستدعاء API الذكاء الاصطناعي هنا
      // const aiResponse = await callYourAI(message);
      // assistantReply = aiResponse.content;
      assistantReply = "هذا رد وهمي من الذكاء الاصطناعي."; // رد مؤقت
    }
    
    // إذا كان هناك رد من الذكاء الاصطناعي، قم بحفظه
    if (assistantReply) {
        const { data: assistantMessage, error: assistantError } = await supabase
            .from('messages')
            .insert({
                session_id: sessionId,
                content: assistantReply,
                role: 'assistant',
            })
            .select()
            .single();

        if (assistantError) {
            console.error("Error saving assistant message:", assistantError)
            throw assistantError
        }
        return NextResponse.json({ message: assistantMessage });
    }

    return NextResponse.json({ message: savedMessage })

  } catch (error: any) {
    console.error("[CHAT_MESSAGE_API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
