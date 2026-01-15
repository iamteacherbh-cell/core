// app/api/webhook/telegram/route.ts
export const runtime = 'edge'; // مهم جداً لـ Telegram Webhook

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

    const ADMIN_TELEGRAM_ID = process.env.TELEGRAM_ADMIN_ID;

    // =========================
    // 1️⃣ رسائل المستخدم الخاصة
    // =========================
    if (message && message.text) {
      const telegramChatId = message.chat.id.toString();
      const telegramMessageId = message.message_id.toString();
      const username = message.from?.username || null;
      const text = message.text;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("telegram_chat_id", telegramChatId)
        .single();

      if (!profile) {
        console.log(`❌ USER NOT FOUND for chat_id: ${telegramChatId}`);
      } else {
        console.log(`✅ USER FOUND: ${profile.id}`);
        const userId = profile.id;

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

        await supabase.from("messages").insert({
          session_id: session.id,
          user_id: userId,
          role: "user",
          content: text,
          telegram_message_id: telegramMessageId,
          telegram_chat_id: telegramChatId,
          telegram_username: username,
        });

        await supabase
          .from("chat_sessions")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", session.id);

        console.log(`💬 User message saved for session ${session.id}`);
      }
    }

    // =========================
    // 2️⃣ رسائل القنوات
    // =========================
    if (channelPost && channelPost.text) {
      const channelChatId = channelPost.chat.id.toString();
      const channelName = channelPost.chat.title;
      const channelUsername = channelPost.chat.username;
      const messageId = channelPost.message_id.toString();
      const text = channelPost.text;
      const sender = channelPost.from;

      // حفظ رسالة القناة
      await supabase.from("channel_messages").insert({
        telegram_chat_id: channelChatId,
        channel_name: channelName,
        channel_username: channelUsername,
        message_text: text,
        message_id: messageId,
      });

      console.log(`📢 Channel message saved from ${channelName}`);

      // ======= 2.1 mention @username =======
      const mentionMatch = text.match(/@(\w+)/);
      if (mentionMatch) {
        const targetUsername = mentionMatch[1];

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
              role: "user",
              content: text,
              sender_name: sender?.first_name || sender?.username || "Channel User",
            });

            console.log(`🔔 Mention saved for @${targetUsername}`);
          }
        }
      }

      // ======= 2.2 رد الأدمن عبر reply_to_message =======
      if (
        sender &&
        sender.id.toString() === ADMIN_TELEGRAM_ID &&
        channelPost.reply_to_message
      ) {
        const replyText = channelPost.text;
        const originalMessageId =
          channelPost.reply_to_message.message_id?.toString();

        if (replyText && originalMessageId) {
          const { data: originalMsg } = await supabase
            .from("messages")
            .select("user_id, session_id")
            .eq("telegram_message_id", originalMessageId)
            .single();

          if (originalMsg) {
            await supabase.from("messages").insert({
              session_id: originalMsg.session_id,
              user_id: originalMsg.user_id,
              role: "assistant",
              content: replyText,
              sender_name: "Admin (via Telegram)",
            });

            console.log("🛠 Admin reply saved via reply_to_message");
          }
        }
      }

      // ======= 2.3 رد الأدمن عبر @username =======
      if (sender && sender.id.toString() === ADMIN_TELEGRAM_ID) {
        const adminMatch = text.match(/@(\w+)/);
        if (adminMatch) {
          const targetUsername = adminMatch[1];
          const adminReply = text.replace(/@\w+/, "").trim();

          if (adminReply.length > 0) {
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
                  content: adminReply,
                  sender_name: "Admin (via Telegram)",
                });

                console.log(`🛠 Admin direct @ reply saved for @${targetUsername}`);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ TELEGRAM WEBHOOK ERROR", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
