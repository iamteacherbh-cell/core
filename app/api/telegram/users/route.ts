import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // التحقق إذا كان المستخدم admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    // جلب جميع المستخدمين المرتبطين بـ Telegram
    const { data: profiles } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        telegram_chat_id,
        telegram_username,
        telegram_id,
        language,
        created_at,
        updated_at
      `)
      .not("telegram_chat_id", "is", null)
      .order("updated_at", { ascending: false })

    if (!profiles) {
      return NextResponse.json({ success: true, users: [] })
    }

    // جلب آخر رسالة وعدد الرسائل غير المقروءة لكل مستخدم
    const usersWithMessages = await Promise.all(
      profiles.map(async (profile) => {
        // آخر رسالة
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, role")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        // عدد الرسائل غير المقروءة
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", profile.id)
          .eq("role", "user")
          .eq("read_by_admin", false)

        return {
          ...profile,
          last_message: lastMessage?.content || "",
          last_message_time: lastMessage?.created_at || "",
          unread_count: unreadCount || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      users: usersWithMessages,
      total: usersWithMessages.length
    })

  } catch (error: any) {
    console.error("[TELEGRAM-USERS] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
