import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { chatId, message, isChannel } = await req.json();

    if (!chatId || !message) {
      return NextResponse.json({ error: "chatId and message are required" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Telegram bot token is not configured" }, { status: 500 });
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram API error:", data);
      return NextResponse.json({ error: `Failed to send message: ${data.description}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message_id: data.result.message_id });

  } catch (error: any) {
    console.error("Error in /api/telegram/send-message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
