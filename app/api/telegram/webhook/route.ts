import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const body = await req.json()

    console.log("[TG] Webhook Received:", JSON.stringify(body, null, 2))

    // استخراج الرسالة من أنواع مختلفة (رسالة عادية، رسالة قناة، رسالة معدلة)
    const message = body.message || body.edited_message;
    const channelPost = body.channel_post || body.edited_channel_post;

    // === الحالة الأولى: رسالة من مستخدم خاص (Direct Message) ===
    if (message && message.text) {
      const telegramChatId = message.chat.id.toString();
      const telegramMessageId = message.message_id.toString();
      const username = message.from?.username || message.chat?.username || null;
      const text = message.text;

      // 1️⃣ إيجاد المستخدم المرتبط بهذا الـ chat_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("telegram_chat_id", telegramChatId)
        .single();

      // إذا لم يتم العثور على المستخدم، لا تفعل شيئًا وأكمل
      if (!profile) {
        console.log(`[TG] User not linked for chat_id: ${telegramChatId}`);
        return NextResponse.json({ ok: true, note: "User not linked" });
      }

      const userId = profile.id;

      // 2️⃣ جلب أو إنشاء جلسة (session) للمستخدم
      let { data: session } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .single();

      if (!session) {
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: "Telegram Chat",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        
        session = newSession;
      }

      // 3️⃣ حفظ الرسالة في جدول الرسائل الموحد
      await supabase.from("messages").insert({
        session_id: session.id,
        user_id: userId,
        role: "user",
        content: text,
        telegram_message_id: telegramMessageId,
        telegram_chat_id: telegramChatId,
        telegram_username: username,
      });

      // 4️⃣ تحديث وقت آخر رسالة في الجلسة
      await supabase
        .from("chat_sessions")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", session.id);
        
      console.log(`[TG] Saved user message from ${username} to session ${session.id}`);
    }

    // === الحالة الثانية: رسالة من قناة (Channel Post) ===
    if (channelPost && channelPost.text) {
      const channelChatId = channelPost.chat.id.toString(); // هذا هو المعرف الذي أرسلته (-100...)
      const channelName = channelPost.chat.title;
      const channelUsername = channelPost.chat.username;
      const messageId = channelPost.message_id.toString();
      const text = channelPost.text;

      console.log(`[TG] Received message from channel: ${channelName} (${channelChatId})`);

      // حفظ رسالة القناة في جدولها الخاص
      const { error } = await supabase.from("channel_messages").insert({
        telegram_chat_id: channelChatId,
        channel_name: channelName,
        channel_username: channelUsername,
        message_text: text,
        message_id: messageId,
      });

      if (error) {
        console.error("Error saving channel message:", error);
      } else {
        console.log(`[TG] Successfully saved channel message from ${channelName}`);
      }
    }

    // إرجاع نجاح لتيليجرام حتى لا يعيد المحاولة
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error("[TG WEBHOOK ERROR]", err)
    return NextResponse.json({ error: "Telegram webhook failed" }, { status: 500 })
  }
}
