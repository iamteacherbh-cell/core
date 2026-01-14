import { createClient } from "@/lib/supabase/server" // <--- تم تصحيح الاستيراد
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient() // <--- تم تصحيح الاستدعاء

    // ================= Auth =================
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // ================= Profile =================
    let { data: profile } = await supabase
      .from("profiles")
      .select("id,email,full_name,telegram_chat_id,telegram_username")
      .eq("id", user.id)
      .single()

    if (!profile) {
      const { data: created } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.email?.split("@")[0] || "User",
        })
        .select()
        .single()

      profile = created
    }

    // ================= Sessions =================
    let { data: sessions } = await supabase
      .from("chat_sessions")
      .select("id,title,created_at,last_message_at,platform")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .limit(10)

    let activeSessionId = sessions?.[0]?.id || null

    // ================= Create session if none =================
    if (!activeSessionId) {
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: "New Chat",
          platform: "web",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error || !newSession) {
        console.error("[CHAT-HISTORY] Failed to create session:", error)
        return NextResponse.json({
          success: false,
          error: "Cannot create session"
        }, { status: 500 })
      }

      activeSessionId = newSession.id
      sessions = [newSession]
    }

    // ================= Messages =================
    const { data: messages } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        role,
        session_id,
        telegram_message_id,
        telegram_chat_id,
        telegram_username,
        created_at
      `)
      .eq("session_id", activeSessionId)
      .order("created_at", { ascending: true })

    // ================= Telegram connections =================
    let telegramConnections: any[] = []

    if (profile.telegram_chat_id) {
      telegramConnections.push({
        id: profile.id,
        name: profile.full_name || profile.email,
        telegram_chat_id: profile.telegram_chat_id,
        telegram_username: profile.telegram_username,
        is_self: true,
      })

      const { data: others } = await supabase
        .from("profiles")
        .select("id,full_name,email,telegram_chat_id,telegram_username")
        .not("telegram_chat_id", "is", null)
        .neq("id", user.id)

      if (others) {
        telegramConnections.push(...others.map(u => ({
          id: u.id,
          name: u.full_name || u.email,
          telegram_chat_id: u.telegram_chat_id,
          telegram_username: u.telegram_username,
          is_self: false,
        })))
      }
    }

    return NextResponse.json({
      success: true,
      user: profile,
      sessions,
      active_session_id: activeSessionId,
      messages,
      telegram_connections: telegramConnections,
    })

  } catch (err: any) {
    console.error("[CHAT-HISTORY] Fatal:", err)
    return NextResponse.json({
      success: false,
      error: err.message || "Server crash"
    }, { status: 500 })
  }
}
