import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const body = await req.json();

    console.log("=== TELEGRAM WEBHOOK HIT ===");
    console.log(JSON.stringify(body, null, 2));

    const message = body.message || body.edited_message;
    const channelPost = body.channel_post || body.edited_channel_post;

    // ==========================
    // 1️⃣ رسائل المستخدم الخاصة
    // ==========================
    if (message && message.text) {
      const telegramChatId = message.chat.id.toString();
      const telegramMessageId = message.message_id.toString();
      const username = message.from?.username || message.chat?.username || null;
      const text = message.text;

      // البحث عن المستخدم
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("telegram_chat_id", telegramChatId)
        .single();

      if (!profile) {
        console.log(`❌ USER NOT FOUND for chat_id: ${telegramChatId}`);
      } else {
        console.log(`✅ USER FOUND: ${profile.id} (${profile.full_name})`);
        const userId = profile.id;

        // البحث عن جلسة أو إنشاؤها
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

        // حفظ الرسالة
        const { error: insertError } = await supabase.from("messages").insert({
          session_id: session.id,
          user_id: userId,
          role: "user",
          content: text,
          telegram_message_id: telegramMessageId,
          telegram_chat_id: telegramChatId,
          telegram_username: username,
        });

        if (insertError) {
          console.error("❌ ERROR SAVING MESSAGE", insertError);
        } else {
          console.log(`✅ MESSAGE SAVED for session ${session.id}`);
        }

        // تحديث آخر رسالة
        await supabase
          .from("chat_sessions")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", session.id);
      }
    }

    // ==========================
    // 2️⃣ رسائل القنوات
    // ==========================
    if (channelPost && channelPost.text) {
      const channelChatId = channelPost.chat.id.toString();
      const channelName = channelPost.chat.title;
      const channelUsername = channelPost.chat.username;
      const messageId = channelPost.message_id.toString();
      const text = channelPost.text;
      const sender = channelPost.from;

      console.log(`📢 CHANNEL MESSAGE from ${channelName}`);

      // حفظ رسالة القناة
      await supabase.from("channel_messages").insert({
        telegram_chat_id: channelChatId,
        channel_name: channelName,
        channel_username: channelUsername,
        message_text: text,
        message_id: messageId,
      });

      // ===== الإشارة لمستخدم من داخل القناة =====
      const mentionMatch = text.match(/@(\w+)/);

      if (mentionMatch) {
        const targetUsername = mentionMatch[1];
        console.log(`🔔 Mention detected: @${targetUsername}`);

        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("telegram_username", targetUsername)
          .single();

        if (targetProfile) {
          const { data: session } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("user_id", targetProfile.id)
            .order("last_message_at", { ascending: false })
            .limit(1)
            .single();

          if (session) {
            await supabase.from("messages").insert({
              session_id: session.id,
              user_id: targetProfile.id,
              role: "user",
              content: text,
              sender_name: `${sender?.first_name || sender?.username || "Channel User"}`,
            });

            console.log(`✅ Mention message saved for @${targetUsername}`);
          }
        }
      }

      // ========================================
      // 3️⃣ رد الأدمن من القناة @username reply
      // ========================================
      if (sender) {
        const adminTelegramId = sender.id.toString();
        const ADMIN_TELEGRAM_ID = "YOUR_ADMIN_TELEGRAM_ID"; // ← استبدله

        console.log(`ADMIN CHECK: ${adminTelegramId} vs ${ADMIN_TELEGRAM_ID}`);

        if (adminTelegramId === ADMIN_TELEGRAM_ID) {
          const adminMatch = text.match(/@(\w+)/);

          if (adminMatch) {
            const targetUsername = adminMatch[1];
            const actualReplyText = text.replace(/@\w+/, "").trim();

            console.log(`🛠 Admin replying to @${targetUsername}: ${actualReplyText}`);

            if (actualReplyText.length > 0) {
              const { data: targetProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("telegram_username", targetUsername)
                .single();

              if (targetProfile) {
                const { data: session } = await supabase
                  .from("chat_sessions")
                  .select("id")
                  .eq("user_id", targetProfile.id)
                  .order("last_message_at", { ascending: false })
                  .limit(1)
                  .single();

                if (session) {
                  await supabase.from("messages").insert({
                    session_id: session.id,
                    user_id: targetProfile.id,
                    role: "assistant",
                    content: actualReplyText,
                    sender_name: "Admin (via Telegram)",
                  });

                  console.log(`✅ Admin reply saved for @${targetUsername}`);
                }
              }
            }
          }
        }
      }
    }

    // الرد لتلغرام
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ TELEGRAM WEBHOOK ERROR", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
