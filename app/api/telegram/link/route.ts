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
    const { user_id, action } = body

    // التحقق أن المستخدم يربط حسابه فقط
    if (user_id !== user.id) {
      return NextResponse.json({ 
        error: "يمكنك ربط حسابك فقط" 
      }, { status: 403 })
    }

    // جلب ملف المستخدم
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 })
    }

    switch (action) {
      case "link":
        // ربط الحساب - نحتاج فقط لجعل المستخدم يرسل المعرف للبوت
        return NextResponse.json({
          success: true,
          message: "تم تفعيل طلب الربط",
          user_id: user.id,
          instructions: "يرجى إرسال معرف المستخدم للبوت @iCoreAI_bot"
        })

      case "unlink":
        // إلغاء الربط
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            telegram_chat_id: null,
            telegram_username: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)

        if (updateError) {
          return NextResponse.json({ 
            error: "فشل في إلغاء الربط" 
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "تم إلغاء ربط حساب Telegram"
        })

      default:
        return NextResponse.json({ 
          error: "إجراء غير صالح" 
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error("[TELEGRAM-LINK] Error:", error)
    return NextResponse.json({ 
      error: "خطأ في الخادم",
      details: error.message 
    }, { status: 500 })
  }
}

// API لجلب حالة الربط
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_chat_id, telegram_username")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      success: true,
      linked: !!profile?.telegram_chat_id,
      telegram_chat_id: profile?.telegram_chat_id,
      telegram_username: profile?.telegram_username
    })

  } catch (error: any) {
    console.error("[TELEGRAM-STATUS] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
