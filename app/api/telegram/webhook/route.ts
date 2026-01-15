export const runtime = 'edge'; // مهم جدًا لـ Telegram Webhook

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
    // 1️⃣ رسائل المستخدم الخاصة (DM)
    // =========================
    if (message && message.text) {
      const telegramMessageId = message.message_id.toString();
      const username = (message.from?.username || "").toLowerCase();
      const text = message.text;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("telegram_username", username)
        .single();

      if (!profile) {
        console.log(`❌ USER NOT FOUND for username: ${username}`);
      } else {
        const userId = profile.id;

        // جلب أو إنشاء الجلسة
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
        await supabase.from("messages").insert({
          session_id: session.id,
          user_id: userId,
          role: "user",
          content: text,
          telegram_message_id: telegramMessageId,
          telegram_username: username,
        });

        // تحديث آخر رسالة
        await supabase
          .from("chat_sessions")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", session.id);

        console.log(`💬 User DM saved for session ${session.id}`);
      }
    }

    // =========================
    // 2️⃣ رسائل القنوات
    // =========================
    if (channelPost && channelPost.text) {
      const channelChatId = channelPost.chat.id.toString();
      const channelName = channelPost.chat.title;
      const text = channelPost.text;
      const messageId = channelPost.message_id.toString();
      const sender = channelPost.from;

      // حفظ رسالة القناة
      await supabase.from("channel_messages").insert({
        telegram_chat_id: channelChatId,
        channel_name: channelName,
        message_text: text,
        message_id: messageId,
      });

      console.log(`📢 Channel message saved from ${channelName}`);

      // ======= 2.1 mentions @username =======
      const mentionMatches = text.matchAll(/@(\w+)/g);
      for (const match of mentionMatches) {
        const targetUsername = match[1].toLowerCase();
        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_username", targetUsername)
          .single();

        if (targetProfile) {
          // جلب أو إنشاء session
          let { data: session } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("user_id", targetProfile.id)
            .order("last_message_at", { ascending: false })
            .limit(1)
            .single();

          if (!session) {
            const { data: newSession } = await supabase
              .from("chat_sessions")
              .insert({
                user_id: targetProfile.id,
                title: "Telegram Chat",
                last_message_at: new Date().toISOString(),
              })
              .select("id")
              .single();
            session = newSession;
          }

          // إضافة الرسالة إلى جدول messages
          await supabase.from("messages").insert({
            session_id: session.id,
            user_id: targetProfile.id,
            role: "assistant",
            content: text,
            sender_name: sender?.username || "Channel User",
          });

          console.log(`🔔 Mention delivered to @${targetUsername}`);
        }
      }

      // ======= 2.2 Admin reply via reply_to_message =======
      if (sender && sender.id.toString() === ADMIN_TELEGRAM_ID && channelPost.reply_to_message) {
        const replyText = text;
        const originalMessageId = channelPost.reply_to_message.message_id?.toString();

        if (originalMessageId) {
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
            console.log(`🛠 Admin reply delivered via reply_to_message`);
          }
        }
      }

      // ======= 2.3 Admin direct @ reply =======
      if (sender && sender.id.toString() === ADMIN_TELEGRAM_ID) {
        const adminMatches = text.matchAll(/@(\w+)/g);
        for (const match of adminMatches) {
          const targetUsername = match[1].toLowerCase();
          const adminReply = text.replace(/@\w+/g, "").trim();
          if (!adminReply) continue;

          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("telegram_username", targetUsername)
            .single();

          if (targetProfile) {
            // جلب أو إنشاء session
            let { data: session } = await supabase
              .from("chat_sessions")
              .select("id")
              .eq("user_id", targetProfile.id)
              .order("last_message_at", { ascending: false })
              .limit(1)
              .single();

            if (!session) {
              const { data: newSession } = await supabase
                .from("chat_sessions")
                .insert({
                  user_id: targetProfile.id,
                  title: "Telegram Chat",
                  last_message_at: new Date().toISOString(),
                })
                .select("id")
                .single();
              session = newSession;
            }

            await supabase.from("messages").insert({
              session_id: session.id,
              user_id: targetProfile.id,
              role: "assistant",
              content: adminReply,
              sender_name: "Admin (via Telegram)",
            });

            console.log(`🛠 Admin direct @ reply delivered to @${targetUsername}`);
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
