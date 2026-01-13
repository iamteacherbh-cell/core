import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { telegram_user_id } = body

    if (!telegram_user_id || !telegram_user_id.trim()) {
      return NextResponse.json({ 
        error: "معرف Telegram مطلوب" 
      }, { status: 400 })
    }

    // التحقق من صيغة المعرف (يجب أن يكون رقم)
    const telegramId = telegram_user_id.trim()
    if (!/^\d+$/.test(telegramId)) {
      return NextResponse.json({ 
        error: "معرف Telegram غير صالح. يجب أن يكون رقماً." 
      }, { status: 400 })
    }

    // جلب ملف المستخدم الحالي
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 })
    }

    // التحقق إذا كان المعرف مستخدماً مسبقاً
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("telegram_id", telegramId)
      .neq("id", user.id)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: "معرف Telegram هذا مربوط بحساب آخر",
        details: `البريد: ${existingUser.email}`
      }, { status: 409 })
    }

    // تحديث ملف المستخدم
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        telegram_id: telegramId,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[TELEGRAM-LINK-BY-ID] Update error:", updateError)
      return NextResponse.json({ 
        error: "فشل في تحديث البيانات" 
      }, { status: 500 })
    }

    // إرسال رسالة ترحيبية عبر البوت
    try {
      // هنا سنضيف إرسال رسالة إلى البوت لاحقاً
      console.log(`[TELEGRAM-LINK-BY-ID] User ${user.id} linked with Telegram ID: ${telegramId}`)
    } catch (botError) {
      console.error("[TELEGRAM-LINK-BY-ID] Bot message error:", botError)
    }

    return NextResponse.json({
      success: true,
      message: "تم ربط حساب Telegram بنجاح",
      telegram_id: telegramId,
      user_id: user.id,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("[TELEGRAM-LINK-BY-ID] Error:", error)
    return NextResponse.json({ 
      error: "خطأ في الخادم",
      details: error.message 
    }, { status: 500 })
  }
}
