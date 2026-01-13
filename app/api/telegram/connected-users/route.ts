// app/api/telegram/connected-users/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "غير مصرح - يرجى تسجيل الدخول" 
      }, { status: 401 })
    }

    console.log(`[CONNECTED-USERS] User authenticated: ${user.email}`)

    // جلب المستخدمين المرتبطين بـ Telegram
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        telegram_username,
        telegram_chat_id,
        telegram_id,
        language,
        created_at,
        updated_at
      `)
      .not("telegram_chat_id", "is", null)
      .order("updated_at", { ascending: false })

    if (profilesError) {
      console.error("[CONNECTED-USERS] Database error:", profilesError)
      return NextResponse.json({ 
        success: false, 
        error: "خطأ في قاعدة البيانات" 
      }, { status: 500 })
    }

    console.log(`[CONNECTED-USERS] Found ${profiles?.length || 0} connected users`)

    // جلب عدد الرسائل غير المقروءة لكل مستخدم
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          // عدد الرسائل غير المقروءة
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", profile.id)
            .eq("role", "user")
            .eq("read_by_admin", false)

          return {
            ...profile,
            unread_count: unreadCount || 0
          }
        } catch (error) {
          console.error(`[CONNECTED-USERS] Error processing user ${profile.id}:`, error)
          return {
            ...profile,
            unread_count: 0
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      total: usersWithStats.length,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("[CONNECTED-USERS] Unexpected error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "خطأ غير متوقع" 
    }, { status: 500 })
  }
}
