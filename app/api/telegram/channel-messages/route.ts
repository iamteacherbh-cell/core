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

    // جلب رسائل قناة Icore
    const { data: messages } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        telegram_username,
        telegram_message_id,
        created_at,
        metadata
      `)
      .eq("metadata->>source", "icore_channel")
      .order("created_at", { ascending: false })
      .limit(50)

    return NextResponse.json({
      success: true,
      messages: messages || [],
      count: messages?.length || 0,
      channel_info: {
        id: "-1003583611128",
        name: "قناة Icore",
        processed: true
      }
    })

  } catch (error: any) {
    console.error("[CHANNEL-MESSAGES] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
