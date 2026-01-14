import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // <--- تم تصحيح الاستيراد
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: Request) {
  try {
    const supabase = await createClient() // <--- استخدام الدالة الصحيحة
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { message, target_user_id, action = 'forward', ai_context } = body

    // التحقق من الحقول المطلوبة
    if (!message || !target_user_id) {
      return NextResponse.json({ 
        success: false,
        error: "الرسالة ومعرف المستخدم (target_user_id) مطلوبان" 
      }, { status: 400 })
    }

    // جلب بيانات المستلم
    const { data: receiverProfile, error: receiverError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", target_user_id)
      .single()

    if (receiverError || !receiverProfile) {
      return NextResponse.json({ 
        success: false,
        error: "المستخدم غير موجود" 
      }, { status: 404 })
    }

    // التحقق من ارتباط المستخدم بـ Telegram
    if (!receiverProfile.telegram_chat_id) {
      // حفظ الرسالة كـ "معلقة" للمستخدم غير المربوط
      const { error: pendingError } = await supabase.from("pending_telegram_messages").insert({
        user_id: receiverProfile.id,
        message: message,
        sender_id: user.id,
        context: ai_context || "رسالة من المساعد الذكي",
        created_at: new Date().toISOString()
      })

      if (pendingError) {
        console.error("Failed to save pending message:", pendingError);
      }
      
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
        sender_name: "المساعد الذكي"
      }
    })

    // حفظ الرسالة في قاعدة البيانات
    const { data: savedMessage, error: saveError } = await supabase
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

    if (saveError) {
        console.error("Failed to save message to database:", saveError);
        // لا نعيد خطأ للمستخدم لأن الرسالة وصلت لتليجرام
    }

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
