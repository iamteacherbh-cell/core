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

    // المستخدمين المرتبطين
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true })
      .not("telegram_chat_id", "is", null)

    // رسائل اليوم
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayMessages } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .gt("created_at", today.toISOString())

    // رسائل الأسبوع
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const { count: weekMessages } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .gt("created_at", lastWeek.toISOString())

    // الرسائل الواردة
    const { count: incomingMessages } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("role", "user")

    // الرسائل الصادرة
    const { count: outgoingMessages } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("role", "admin")

    return NextResponse.json({
      success: true,
      stats: {
        total_users: totalUsers || 0,
        today_messages: todayMessages || 0,
        week_messages: weekMessages || 0,
        incoming_messages: incomingMessages || 0,
        outgoing_messages: outgoingMessages || 0
      }
    })

  } catch (error: any) {
    console.error("[TELEGRAM-STATS] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
