import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "غير مصرح" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, message } = body

    if (!user_id || !message?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "معرف المستخدم والرسالة مطلوبان" 
      }, { status: 400 })
    }

    // جلب بيانات المرسل (المسؤول)
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single()

    if (!senderProfile) {
      return NextResponse.json({ 
        success: false,
        error: "المرسل غير موجود" 
      }, { status: 404 })
    }

    // جلب بيانات المستلم
    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, telegram_chat_id, telegram_username, language")
      .eq("id", user_id)
      .single()

    if (!receiverProfile) {
      return NextResponse.json({ 
        success: false,
        error: "المستلم غير موجود" 
      }, { status: 404 })
    }

    if (!receiverProfile.telegram_chat_id) {
      return NextResponse.json({ 
        success: false,
        error: "المستخدم غير مربوط بـ Telegram" 
      }, { status: 400 })
    }

    // إعداد نص الرسالة بناءً على لغة المستخدم
    let messageText = ""
    if (receiverProfile.language === 'ar') {
      messageText = `📨 *رسالة من ${senderProfile.full_name || "فريق iCore"}*\n\n${message}\n\n💬 للرد، أرسل رسالة إلى البوت.`
    } else {
      messageText = `📨 *Message from ${senderProfile.full_name || "iCore Team"}*\n\n${message}\n\n💬 To reply, send a message to the bot.`
    }

    // إرسال الرسالة عبر Telegram
    const telegramResult = await sendTelegramMessage({
      chat_id: receiverProfile.telegram_chat_id,
      text: messageText,
      parse_mode: "Markdown",
      user_id: receiverProfile.id,
      username: receiverProfile.telegram_username
    })

    // حفظ الرسالة في قاعدة البيانات
    const { data: savedMessage } = await supabase
      .from("messages")
      .insert({
        user_id: receiverProfile.id,
        content: message.trim(),
        role: "admin",
        telegram_chat_id: receiverProfile.telegram_chat_id,
        telegram_message_id: telegramResult.message_id?.toString(),
        sender_id: user.id,
        sender_name: senderProfile.full_name || "Admin",
        read_by_admin: true
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      message: savedMessage,
      telegram_message_id: telegramResult.message_id,
      sent_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("[TELEGRAM-SEND] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
