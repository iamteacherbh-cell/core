import { createServerClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { messageId, replyText, telegramUserId } = await req.json()

    console.log("[v0] Sending reply to telegram_user_id:", telegramUserId)

    const { data: messageData } = await supabase
      .from("telegram_admin_messages")
      .select("telegram_chat_id")
      .eq("id", messageId)
      .single()

    if (!messageData?.telegram_chat_id) {
      // Fallback to telegram_user_id if chat_id not found
      await sendTelegramMessage({
        chat_id: telegramUserId,
        text: replyText,
      })
    } else {
      // Send to the specific chat_id for this user
      await sendTelegramMessage({
        chat_id: messageData.telegram_chat_id,
        text: replyText,
      })
    }

    console.log("[v0] Message sent successfully")

    // Update message in database
    const { error } = await supabase
      .from("telegram_admin_messages")
      .update({
        reply_text: replyText,
        replied_at: new Date().toISOString(),
        admin_id: user.id,
        is_read: true,
      })
      .eq("id", messageId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending telegram reply:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
