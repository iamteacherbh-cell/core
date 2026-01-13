import express from "express"
import { createClient } from "@supabase/supabase-js"
import fetch from "node-fetch"

const app = express()
app.use(express.json())

// Environment variables - must be set
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os"
const PORT = process.env.PORT || 3001
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Telegram API helper
async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("Telegram API error:", error)
    throw new Error("Failed to send Telegram message")
  }

  return response.json()
}

// AI response generator
async function generateAIResponse(prompt, language = "en") {
  if (!OPENAI_API_KEY) {
    return language === "ar" ? "شكراً لرسالتك! تم استلامها بنجاح." : "Thank you for your message! It has been received."
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for iCore, a professional networking platform. 
            Help users with networking, business connections, and professional guidance.
            Always respond in ${language === "ar" ? "Arabic" : "English"}.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error("OpenAI API error")
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("AI generation error:", error)
    return language === "ar" ? "شكراً لرسالتك! أنا هنا لمساعدتك." : "Thank you for your message! I am here to help you."
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "iCore Telegram Bot Server" })
})

// Telegram webhook endpoint
app.post("/telegram/webhook", async (req, res) => {
  try {
    const body = req.body
    console.log("[iCore] Telegram webhook received:", JSON.stringify(body, null, 2))

    if (body.message) {
      const telegramUserId = body.message.from.id.toString()
      const telegramUsername = body.message.from.username || body.message.from.first_name || "Unknown"
      const messageText = body.message.text
      const chatId = body.message.chat.id.toString()

      console.log("[iCore] Processing message from user:", telegramUserId, "chat_id:", chatId)

      // Save admin message for tracking
      await supabase.from("telegram_admin_messages").insert({
        telegram_user_id: telegramUserId,
        telegram_username: telegramUsername,
        telegram_chat_id: chatId,
        message_text: messageText,
        is_read: false,
      })

      // Find user by telegram_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("telegram_id", telegramUserId)
        .single()

      if (profileError || !profile) {
        console.log("[iCore] User not linked, sending welcome message")
        await sendTelegramMessage(
          chatId,
          "مرحباً بك في iCore! 👋\n\n" +
            "يرجى ربط حساب Telegram الخاص بك من لوحة تحكم iCore للبدء في الدردشة.\n\n" +
            "Welcome to iCore! 👋\n\n" +
            "Please link your Telegram account from the iCore dashboard to start chatting.\n\n" +
            "🔗 https://icore.life/dashboard/settings",
        )
        return res.json({ success: true })
      }

      console.log("[iCore] User found:", profile.id)

      // Update telegram_chat_id if changed
      if (profile.telegram_chat_id !== chatId) {
        await supabase.from("profiles").update({ telegram_chat_id: chatId }).eq("id", profile.id)
        console.log("[iCore] Updated telegram_chat_id to:", chatId)
      }

      // Get or create chat session
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)

      let session = sessions?.[0]

      if (!session) {
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: profile.id,
            title: profile.language === "ar" ? "محادثة جديدة" : "New Chat",
          })
          .select()
          .single()
        session = newSession
      }

      // Save user message
      await supabase.from("messages").insert({
        session_id: session.id,
        user_id: profile.id,
        content: messageText,
        role: "user",
        telegram_message_id: body.message.message_id.toString(),
      })

      // Update session
      await supabase.from("chat_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", session.id)

      console.log("[iCore] Message saved to database")

      // Generate AI response
      const aiResponse = await generateAIResponse(messageText, profile.language)

      console.log("[iCore] AI response generated")

      // Send to Telegram
      await sendTelegramMessage(chatId, aiResponse)

      console.log("[iCore] Response sent to Telegram")

      // Save assistant response
      await supabase.from("messages").insert({
        session_id: session.id,
        user_id: profile.id,
        content: aiResponse,
        role: "assistant",
      })

      console.log("[iCore] Assistant response saved")
    }

    res.json({ success: true })
  } catch (error) {
    console.error("[iCore] Telegram webhook error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Setup webhook endpoint
app.post("/telegram/setup-webhook", async (req, res) => {
  try {
    const { webhookUrl } = req.body

    if (!webhookUrl) {
      return res.status(400).json({ error: "webhookUrl is required" })
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("[iCore] Webhook set successfully:", webhookUrl)
      res.json({ success: true, message: "Webhook set successfully", data })
    } else {
      console.error("[iCore] Failed to set webhook:", data)
      res.status(500).json({ success: false, error: data.description })
    }
  } catch (error) {
    console.error("[iCore] Setup webhook error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get webhook info
app.get("/telegram/webhook-info", async (req, res) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    const response = await fetch(url)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("[iCore] Get webhook info error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 iCore Telegram Bot Server running on port ${PORT}`)
  console.log(`📡 Webhook endpoint: http://your-server:${PORT}/telegram/webhook`)
  console.log(`💚 Health check: http://your-server:${PORT}/health`)
})
