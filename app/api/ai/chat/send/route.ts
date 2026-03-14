import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "غير مصرح" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { message, target_user_id, action = 'forward', ai_context } = body

    if (!message || !target_user_id) {
      return NextResponse.json({ 
        success: false,
        error: "الرسالة ومعرف المستخدم مطلوبان" 
      }, { status: 400 })
    }

    console.log(`[AI-TO-TELEGRAM] Sending message from ${user.id} to ${target_user_id}`)

    // جلب بيانات المرسل
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()

    // جلب بيانات المستلم
    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", target_user_id)
      .single()

    if (!receiverProfile) {
      return NextResponse.json({ 
        success: false,
        error: "المستخدم غير موجود" 
      }, { status: 404 })
    }

    // التحقق من ارتباط المستخدم بـ Telegram
    if (!receiverProfile.telegram_chat_id) {
      return NextResponse.json({ 
        success: true,
        telegram_sent: false,
        note: "المستخدم غير مربوط بـ Telegram",
        user_info: {
          id: receiverProfile.id,
          name: receiverProfile.full_name,
          email: receiverProfile.email
        }
      })
    }

    // إعداد نص الرسالة
    const messageText = `🤖 *رسالة من المساعد الذكي iCore*\n\n${message}\n\n---\n📝 *السياق:* ${ai_context || "مساعدة من iCore AI"}`

    // إرسال الرسالة عبر Telegram
    const telegramResult = await sendTelegramMessage({
      chat_id: receiverProfile.telegram_chat_id,
      text: messageText,
      parse_mode: "Markdown",
      user_id: receiverProfile.id,
      username: receiverProfile.telegram_username,
      additional_data: {
        type: 'ai_assistant_message',
        action: action,
        sender_id: user.id,
        sender_name: senderProfile?.full_name || "المساعد الذكي",
        ai_context: ai_context
      }
    })

    // حفظ الرسالة في قاعدة البيانات
    const { data: savedMessage } = await supabase
      .from("messages")
      .insert({
        user_id: receiverProfile.id,
        content: message,
        role: "assistant",
        telegram_chat_id: receiverProfile.telegram_chat_id,
        telegram_message_id: telegramResult.message_id?.toString(),
        sender_id: user.id,
        sender_name: "المساعد الذكي",
        metadata: {
          via_ai_chat: true,
          action: action,
          ai_context: ai_context,
          telegram_sent: true,
          telegram_result: telegramResult
        }
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      telegram_sent: true,
      message: savedMessage,
      telegram_message_id: telegramResult.message_id,
      user_info: {
        id: receiverProfile.id,
        name: receiverProfile.full_name,
        telegram_username: receiverProfile.telegram_username,
        email: receiverProfile.email
      },
      sent_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("[AI-TO-TELEGRAM] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
