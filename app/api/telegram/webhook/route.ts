import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const body = await req.json()

    console.log("[TG] Webhook:", JSON.stringify(body, null, 2))

    const msg =
      body.message ||
      body.channel_post ||
      body.edited_message ||
      body.edited_channel_post

    if (!msg || !msg.text) {
      return NextResponse.json({ ok: true })
    }

    const telegramChatId = msg.chat.id.toString()   // مهم جداً
    const telegramMessageId = msg.message_id.toString()
    const username = msg.from?.username || msg.chat?.username || null
    const text = msg.text

    // 1️⃣ إيجاد المستخدم المرتبط بهذا chat
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,email")
      .eq("telegram_chat_id", telegramChatId)
      .single()

    if (!profile) {
      return NextResponse.json({ ok: true, note: "User not linked" })
    }

    const userId = profile.id

    // 2️⃣ جلب أو إنشاء session
    let { data: session } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .single()

    if (!session) {
      const { data: newSession } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title: "Telegram Chat",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      session = newSession
    }

    // 3️⃣ تخزين الرسالة
    await supabase.from("messages").insert({
      session_id: session.id,
      user_id: userId,
      role: "user",
      content: text,
      telegram_message_id: telegramMessageId,
      telegram_chat_id: telegramChatId,
      telegram_username: username,
    })

    // 4️⃣ تحديث وقت الجلسة
    await supabase
      .from("chat_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", session.id)

    return NextResponse.json({ ok: true, session_id: session.id })
  } catch (err) {
    console.error("[TG ERROR]", err)
    return NextResponse.json({ error: "telegram webhook failed" }, { status: 500 })
  }
}
