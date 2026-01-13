import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

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

    const userId = params.userId

    // جلب رسائل المستخدم
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100)

    // تحديث الرسائل كمقروءة
    await supabase
      .from("messages")
      .update({ read_by_admin: true })
      .eq("user_id", userId)
      .eq("role", "user")

    return NextResponse.json({
      success: true,
      messages: messages || [],
      count: messages?.length || 0
    })

  } catch (error: any) {
    console.error("[USER-MESSAGES] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
