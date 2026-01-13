import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المصادقة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { action = 'process_all', limit = 50 } = body

    if (action === 'process_all') {
      // جلب الرسائل الفاشلة
      const { data: pendingMessages, error } = await supabase
        .from("pending_channel_messages")
        .select("*")
        .eq("is_processed", false)
        .order("created_at", { ascending: true })
        .limit(limit)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!pendingMessages || pendingMessages.length === 0) {
        return NextResponse.json({
          success: true,
          processed: 0,
          message: "لا توجد رسائل معلقة"
        })
      }

      // البحث عن مستخدم القناة
      const { data: channelUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", "channel@icore.life")
        .single()

      if (!channelUser) {
        return NextResponse.json({
          success: false,
          error: "مستخدم القناة غير موجود"
        }, { status: 404 })
      }

      let processedCount = 0
      const errors = []

      for (const pendingMsg of pendingMessages) {
        try {
          // حفظ الرسالة
          await supabase.from("messages").insert({
            user_id: channelUser.id,
            content: pendingMsg.message_text,
            role: "user",
            telegram_chat_id: pendingMsg.telegram_chat_id,
            metadata: {
              source: "icore_channel_retry",
              is_retry: true,
              original_pending_id: pendingMsg.id,
              ...pendingMsg.metadata
            },
            created_at: pendingMsg.created_at || new Date().toISOString()
          })

          // تحديث الرسالة كمعالجة
          await supabase
            .from("pending_channel_messages")
            .update({
              is_processed: true,
              processed_at: new Date().toISOString()
            })
            .eq("id", pendingMsg.id)

          processedCount++
        } catch (error) {
          errors.push({
            id: pendingMsg.id,
            error: error.message
          })
        }
      }

      return NextResponse.json({
        success: true,
        processed: processedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `تم معالجة ${processedCount} رسالة`
      })
    }

    return NextResponse.json({
      success: false,
      error: "إجراء غير معروف"
    }, { status: 400 })

  } catch (error: any) {
    console.error("[PROCESS-PENDING] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
