import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { userId } = await params

    // جلب رسائل المستخدم
    const { data: messages } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!sender_id(full_name)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200)

    // تحديث الرسائل كمقروءة
    if (messages && messages.length > 0) {
      await supabase
        .from("messages")
        .update({ read_by_admin: true })
        .eq("user_id", userId)
        .eq("role", "user")
        .eq("read_by_admin", false)
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      count: messages?.length || 0
    })

  } catch (error: any) {
    console.error("[USER-MESSAGES] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
