import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  language?: string
  telegram_chat_id?: string
  telegram_username?: string
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: profile as Profile
    })

  } catch (error: any) {
    console.error("[USER-PROFILE] Error:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
