export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const body = await req.json();

    const message = body.message || body.edited_message;
    const channelPost = body.channel_post || body.edited_channel_post;
    const ADMIN_TELEGRAM_ID = process.env.TELEGRAM_ADMIN_ID;

    // 1️⃣ رسائل المستخدم الخاصة
    if (message && message.text) {
      const username = message.from?.username?.toLowerCase() || null;
      const text = message.text;
      const telegramMessageId = message.message_id.toString();

      if (username) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .ilike("telegram_username", username) // case-insensitive
          .single();

        if (profile) {
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
            telegram_username: username,
          });

          await supabase
            .from("chat_sessions")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", session.id);
        }
      }
    }

    // 2️⃣ رسائل القنوات + mentions
    if (channelPost && channelPost.text) {
      const text = channelPost.text;
      const channelChatId = channelPost.chat.id.toString();
      const messageId = channelPost.message_id.toString();
      const sender = channelPost.from;

      // حفظ رسالة القناة
      await supabase.from("channel_messages").insert({
        telegram_chat_id: channelChatId,
        channel_name: channelPost.chat.title,
        message_text: text,
        message_id: messageId,
      });

      // استخراج كل mentions في الرسالة
      const mentionMatches = text.match(/@(\w+)/g);
      if (mentionMatches?.length) {
        for (const rawMention of mentionMatches) {
          const targetUsername = rawMention.replace("@", "").toLowerCase();

          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("id")
            .ilike("telegram_username", targetUsername)
            .single();

          if (targetProfile) {
            const userId = targetProfile.id;

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
                  title: `Mention from ${channelPost.chat.title}`,
                  last_message_at: new Date().toISOString(),
                })
                .select("id")
                .single();
              session = newSession;
            }

            await supabase.from("messages").insert({
              session_id: session.id,
              user_id: userId,
              role: sender?.id.toString() === ADMIN_TELEGRAM_ID ? "assistant" : "user",
              content: text,
              sender_name: sender?.username || "Channel User",
            });

            await supabase
              .from("chat_sessions")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", session.id);
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
