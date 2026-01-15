import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
    console.log("!!! WEBHOOK HIT !!! Body received:", JSON.stringify(body, null, 2));

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

        if (!profile) {
            console.log(`[TG] User not linked for chat_id: ${telegramChatId}`);
        } else {
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
    }

    // === الحالة الثانية: رسالة من قناة (Channel Post) ===
    if (channelPost && channelPost.text) {
        const channelChatId = channelPost.chat.id.toString();
        const channelName = channelPost.chat.title;
        const channelUsername = channelPost.chat.username;
        const messageId = channelPost.message_id.toString();
        const text = channelPost.text;
        const sender = channelPost.from;

        console.log(`[TG] Received message from channel: ${channelName}`);

        // 1. حفظ رسالة القناة في جدولها الخاص
        const { error: channelError } = await supabase.from("channel_messages").insert({
            telegram_chat_id: channelChatId,
            channel_name: channelName,
            channel_username: channelUsername,
            message_text: text,
            message_id: messageId,
        });

        if (channelError) {
            console.error("Error saving channel message:", channelError);
        } else {
            console.log(`[TG] Successfully saved channel message from ${channelName}`);
        }
        
        // 2. === معالجة أي إشارة (mention) من القناة ===
        const mentionMatch = text.match(/@(\w+)/);
        if (mentionMatch) {
            const targetUsername = mentionMatch[1];
            const originalMessageText = text;

            console.log(`[TG] Detected mention for @${targetUsername}`);

            // البحث عن ملف تعريف المستخدم المستهدف
            const { data: targetProfile, error: profileError } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("telegram_username", targetUsername)
                .single();

            if (profileError || !targetProfile) {
                console.error(`[TG] Could not find user with username @${targetUsername} for mention.`);
            } else {
                // البحث عن جلسة المستخدم المستهدف
                const { data: session, error: sessionError } = await supabase
                    .from("chat_sessions")
                    .select("id")
                    .eq("user_id", targetProfile.id)
                    .order("last_message_at", { ascending: false })
                    .limit(1)
                    .single();

                if (sessionError || !session) {
                    console.error(`[TG] Could not find session for user @${targetUsername} for mention.`);
                } else {
                    // حفظ الرسالة التي تحتوي على الإشارة في دردشة المستخدم المستهدف
                    const { error: saveError } = await supabase.from("messages").insert({
                        session_id: session.id,
                        user_id: targetProfile.id,
                        role: 'user', // تعتبر رسالة مستخدم
                        content: originalMessageText,
                        sender_name: `${sender?.first_name || sender?.username || 'شخص'} (من قناة تيليجرام)`,
                    });

                    if (saveError) {
                        console.error(`[TG] Error saving mentioned message for @${targetUsername}:`, saveError);
                    } else {
                        console.log(`[TG] Successfully saved mentioned message for @${targetUsername} in their chat.`);
                    }
                }
            }
        }

        // 3. === معالجة ردود الأدمن من القناة (إذا كان المرسل هو الأدمن) ===
        if (sender) {
            const adminTelegramUserId = sender.id.toString();
            
            // !!! مهم: استبدل هذا بمعرفك الفعلي في تيليجرام (من @userinfobot) !!!
            const ADMIN_TELEGRAM_ID = 'YOUR_ADMIN_TELEGRAM_ID'; 

            if (adminTelegramUserId === ADMIN_TELEGRAM_ID) {
                console.log(`[TG] Received potential admin reply from channel: ${text}`);

                // استخدام regex للعثور على @username
                const adminMentionMatch = text.match(/@(\w+)/);
                if (adminMentionMatch) {
                    const targetUsername = adminMentionMatch[1];
                    const actualReplyText = text.replace(/@\w+/, '').trim();

                    if (actualReplyText) { // التأكد من وجود نص في الرد
                        console.log(`[TG] Admin replying to @${targetUsername} with: "${actualReplyText}"`);

                        // البحث عن ملف تعريف المستخدم المستهدف
                        const { data: targetProfile, error: profileError } = await supabase
                            .from("profiles")
                            .select("id")
                            .eq("telegram_username", targetUsername)
                            .single();

                        if (profileError || !targetProfile) {
                            console.error(`[TG] Could not find user with username @${targetUsername}`);
                        } else {
                            // البحث عن جلسة المستخدم المستهدف
                            const { data: session, error: sessionError } = await supabase
                                .from("chat_sessions")
                                .select("id")
                                .eq("user_id", targetProfile.id)
                                .order("last_message_at", { ascending: false })
                                .limit(1)
                                .single();
                            
                            if (sessionError || !session) {
                                console.error(`[TG] Could not find session for user @${targetUsername}`);
                            } else {
                                // حفظ رد الأدمن في جدول الرسائل الموحد
                                const { error: saveError } = await supabase.from("messages").insert({
                                    session_id: session.id,
                                    user_id: targetProfile.id,
                                    role: "assistant",
                                    content: actualReplyText,
                                    sender_name: 'Admin (via Telegram)',
                                });

                                if (saveError) {
                                    console.error(`[TG] Error saving admin reply for @${targetUsername}:`, saveError);
                                } else {
                                    console.log(`[TG] Successfully saved admin reply for user @${targetUsername}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // إرجاع نجاح لتيليجرام حتى لا يعيد المحاولة
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error("[TG WEBHOOK ERROR]", err)
    return NextResponse.json({ error: "Telegram webhook failed" }, { status: 500 })
  }
}
