import { createServerClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram"
import { NextResponse } from "next/server"

const AI_RESPONSES = {
  ar: {
    greeting: "مرحباً بك في iCore! 👋 أنا هنا لمساعدتك في بناء شبكة علاقاتك المهنية. كيف يمكنني مساعدتك اليوم؟",
    networking: "يمكنك بناء شبكة علاقات قوية من خلال:\n\n✅ إضافة معلومات مفصلة في ملفك الشخصي\n✅ التواصل مع محترفين في مجالك\n✅ مشاركة خبراتك وإنجازاتك\n✅ المشاركة في المناقشات المهنية\n\nهل تحتاج مساعدة في شيء محدد؟",
    profile: "لتحسين ملفك الشخصي:\n\n📝 اذهب إلى الإعدادات\n📸 أضف صورة احترافية\n💼 أكمل معلوماتك المهنية\n🔗 اربط حسابك بتليجرام للتواصل السريع\n\nهل تحتاج مساعدة في شيء آخر؟",
    help: "يسعدني مساعدتك! 😊\n\nيمكنني مساعدتك في:\n• بناء شبكة العلاقات\n• تحسين ملفك الشخصي\n• التواصل مع الآخرين\n• استخدام المنصة\n\nما الذي تحتاج مساعدة فيه؟",
    default: "شكراً لتواصلك معي! 💡 أنا المساعد الذكي لـ iCore، وأنا هنا لمساعدتك في:\n\n• بناء شبكة علاقاتك المهنية\n• التواصل مع محترفين في مجالك\n• تحسين ملفك الشخصي\n• الإجابة على أسئلتك\n\nكيف يمكنني مساعدتك؟"
  },
  en: {
    greeting: "Welcome to iCore! 👋 I'm here to help you build your professional network. How can I assist you today?",
    networking: "You can build a strong network through:\n\n✅ Adding detailed information to your profile\n✅ Connecting with professionals in your field\n✅ Sharing your expertise and achievements\n✅ Participating in professional discussions\n\nDo you need help with something specific?",
    profile: "To improve your profile:\n\n📝 Go to Settings\n📸 Add a professional photo\n💼 Complete your professional information\n🔗 Link your Telegram account for quick communication\n\nNeed help with anything else?",
    help: "I'm happy to help! 😊\n\nI can assist you with:\n• Building your network\n• Improving your profile\n• Connecting with others\n• Using the platform\n\nWhat do you need help with?",
    default: "Thanks for reaching out! 💡 I'm the iCore AI Assistant, here to help you with:\n\n• Building your professional network\n• Connecting with professionals in your field\n• Improving your profile\n• Answering your questions\n\nHow can I help you?"
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, session_id } = await req.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // جلب ملف المستخدم
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const language = profile.language || "ar"
    const responses = AI_RESPONSES[language as keyof typeof AI_RESPONSES] || AI_RESPONSES.ar

    // تحديد الجلسة
    let sessionId = session_id
    if (!sessionId) {
      // البحث عن آخر جلسة
      const { data: lastSession } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .single()
      
      sessionId = lastSession?.id
    }

    // إنشاء جلسة جديدة إذا لم توجد
    if (!sessionId) {
      const { data: newSession } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: language === "ar" ? "محادثة مع AI" : "AI Conversation",
          platform: "web"
        })
        .select()
        .single()
      
      if (newSession) {
        sessionId = newSession.id
      }
    }

    // حفظ رسالة المستخدم
    const { data: userMessage } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: message,
        role: "user"
      })
      .select()
      .single()

    // توليد رد AI
    const msgLower = message.toLowerCase()
    let aiResponse = responses.default
    
    if (msgLower.includes("hello") || msgLower.includes("hi") || 
        msgLower.includes("مرحبا") || msgLower.includes("السلام")) {
      aiResponse = responses.greeting
    } else if (msgLower.includes("connect") || msgLower.includes("network") ||
               msgLower.includes("شبكة") || msgLower.includes("تواصل")) {
      aiResponse = responses.networking
    } else if (msgLower.includes("profile") || msgLower.includes("account") ||
               msgLower.includes("ملف") || msgLower.includes("حساب")) {
      aiResponse = responses.profile
    } else if (msgLower.includes("help") || msgLower.includes("مساعدة")) {
      aiResponse = responses.help
    }

    // حفظ رد AI
    const { data: aiMessage } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: aiResponse,
        role: "assistant"
      })
      .select()
      .single()

    // تحديث وقت آخر رسالة في الجلسة
    await supabase
      .from("chat_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", sessionId)

    // إرسال إلى Telegram إذا كان مرتبطاً
    if (profile.telegram_chat_id) {
      try {
        await sendTelegramMessage({
          chat_id: profile.telegram_chat_id,
          text: `🤖 ${language === "ar" ? "رد من iCore AI" : "Response from iCore AI"}:\n\n${aiResponse}`,
          parse_mode: "Markdown"
        })
      } catch (telegramError) {
        console.error("[AI-CHAT] Failed to send to Telegram:", telegramError)
      }
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      messages: {
        user: userMessage,
        ai: aiMessage
      },
      response: aiResponse
    })

  } catch (error) {
    console.error("[AI-CHAT] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
