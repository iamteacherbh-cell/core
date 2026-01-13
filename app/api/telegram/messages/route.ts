import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request) {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chat_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const direction = searchParams.get('direction')
    
    // بناء الاستعلام
    let query = supabase
      .from("telegram_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (chatId) {
      query = query.eq("telegram_chat_id", chatId)
    }
    
    if (direction) {
      query = query.eq("direction", direction)
    }
    
    const { data: messages, error } = await query
    
    if (error) {
      throw error
    }
    
    // جلب إحصائيات
    const { count: totalCount } = await supabase
      .from("telegram_messages")
      .select('*', { count: 'exact', head: true })
    
    const { count: incomingCount } = await supabase
      .from("telegram_messages")
      .select('*', { count: 'exact', head: true })
      .eq("direction", "incoming")
    
    const { count: outgoingCount } = await supabase
      .from("telegram_messages")
      .select('*', { count: 'exact', head: true })
      .eq("direction", "outgoing")
    
    return NextResponse.json({
      success: true,
      messages: messages || [],
      statistics: {
        total: totalCount || 0,
        incoming: incomingCount || 0,
        outgoing: outgoingCount || 0
      },
      pagination: {
        limit,
        offset,
        total: totalCount || 0
      }
    })
    
  } catch (error) {
    console.error("[TELEGRAM-MESSAGES] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
