import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request) {
  try {
    const supabase = await createServerClient()
    
    // التحقق من المستخدم
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // توليد token
    const token = require('crypto').randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 دقيقة
    
    // حفظ في قاعدة البيانات
    const { data: linkRequest, error } = await supabase
      .from("telegram_link_requests")
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error("[GENERATE-LINK] Error:", error)
      return NextResponse.json({ error: "Failed to create link" }, { status: 500 })
    }
    
    // إنشاء الروابط
    const botUsername = "iCoreAI_bot" // استبدل باسم بوتك
    const telegramLink = `https://t.me/${botUsername}?start=${token}`
    
    return NextResponse.json({
      success: true,
      token: token,
      telegram_link: telegramLink,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(telegramLink)}`,
      expires_at: expiresAt.toISOString(),
      instructions: `انقر على الرابط أو امسح QR Code للربط التلقائي`
    })
    
  } catch (error) {
    console.error("[GENERATE-LINK] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
