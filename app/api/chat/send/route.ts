import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { message, target_user_id, action = 'forward', ai_context } = body

    if (!message || !target_user_id) {
      return NextResponse.json({ 
        success: false,
        error: "الرسالة ومعرف المستخدم مطلوبان" 
      }, { status: 400 })
    }

    // جلب بيانات المرسل (المسؤول/المساعد الذكي)
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
      // حفظ الرسالة كـ "معلقة" للمستخدم غير المربوط
      await supabase.from("pending_telegram_messages").insert({
        user_id: receiverProfile.id,
        message: message,
        sender_id: user.id,
        context: ai_context || "رسالة من المساعد الذكي",
        created_at: new Date().toISOString()
      })
      
      return NextResponse.json({ 
        success: true,
        telegram_sent: false,
        pending: true,
        note: "الرسالة حفظت كـ معلقة، سيتم إرسالها عند ربط Telegram"
      })
    }

    // إرسال الرسالة إلى Telegram
    const telegramResult = await sendTelegramMessage({
      chat_id: receiverProfile.telegram_chat_id,
      text: `🤖 *رسالة من المساعد الذكي*\n\n${message}\n\n---\n📝 *المحتوى:* ${ai_context || "مساعدة من iCore AI"}`,
      parse_mode: "Markdown",
      user_id: receiverProfile.id,
      username: receiverProfile.telegram_username,
      additional_data: {
        type: 'ai_assistant_message',
        action: action,
        sender_id: user.id,
        sender_name: senderProfile?.full_name || "المساعد الذكي"
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
        telegram_message_id: telegramResult.message_id,
        sender_id: user.id,
        sender_name: "المساعد الذكي",
        metadata: {
          via_ai_chat: true,
          action: action,
          ai_context: ai_context,
          telegram_sent: true
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
        telegram_username: receiverProfile.telegram_username
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
