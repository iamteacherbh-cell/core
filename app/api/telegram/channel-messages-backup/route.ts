import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { session_id, message } = await req.json()

  // 1️⃣ جلب الجلسة
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("user_id")
    .eq("id", session_id)
    .single()

  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 })
  }

  // 2️⃣ جلب Telegram chat
  const { data: profile } = await supabase
    .from("profiles")
    .select("telegram_chat_id")
    .eq("id", session.user_id)
    .single()

  if (!profile?.telegram_chat_id) {
    return NextResponse.json({ error: "User not linked to Telegram" }, { status: 400 })
  }

  // 3️⃣ إرسال إلى Telegram
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id,
        text: message,
      }),
    }
  )

  const tg = await res.json()

  // 4️⃣ حفظ الرد في messages
  await supabase.from("messages").insert({
    session_id,
    user_id: session.user_id,
    role: "assistant",
    content: message,
    telegram_message_id: tg.result?.message_id?.toString() || null,
    telegram_chat_id: profile.telegram_chat_id,
  })

  return NextResponse.json({ success: true })
}
