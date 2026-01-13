import "dotenv/config"
import express from "express"
import { createClient } from "@supabase/supabase-js"
import fetch from "node-fetch"

// Debug: Log all environment variables
console.log("[DEBUG] ========== ENVIRONMENT VARIABLES ==========")
console.log("[DEBUG] SUPABASE_URL:", process.env.SUPABASE_URL || "NOT SET")
console.log("[DEBUG] SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET (hidden)" : "NOT SET")
console.log("[DEBUG] TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? "SET (hidden)" : "NOT SET")
console.log("[DEBUG] PORT:", process.env.PORT || "NOT SET (will use 3001)")
console.log("[DEBUG] ===========================================")

const app = express()
app.use(express.json())

// Validate environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const PORT = process.env.PORT || 3001

if (!SUPABASE_URL) {
  console.error("\n❌ [ERROR] SUPABASE_URL is missing!")
  console.error("📝 Your .env file should contain:")
  console.error("   SUPABASE_URL=https://tozvejugoydqcjaekerk.supabase.co")
  console.error("\n💡 Make sure .env file is in the same directory as index.js")
  process.exit(1)
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("\n❌ [ERROR] SUPABASE_SERVICE_ROLE_KEY is missing!")
  console.error("📝 Check your .env file")
  process.exit(1)
}

if (!TELEGRAM_BOT_TOKEN) {
  console.error("\n❌ [ERROR] TELEGRAM_BOT_TOKEN is missing!")
  console.error("📝 Check your .env file")
  process.exit(1)
}

console.log("\n✅ [SUCCESS] All environment variables loaded!")
console.log("[INFO] SUPABASE_URL:", SUPABASE_URL)
console.log("[INFO] TELEGRAM_BOT_TOKEN:", TELEGRAM_BOT_TOKEN.substring(0, 15) + "...")

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Telegram Bot API base URL
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Send message to Telegram
async function sendTelegramMessage(chatId, text) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()
    if (!data.ok) {
      console.error("[ERROR] Telegram API error:", data)
      return false
    }
    return true
  } catch (error) {
    console.error("[ERROR] Failed to send Telegram message:", error.message)
    return false
  }
}

// Simple AI response generator (no external API needed)
function generateAIResponse(message) {
  const lowerMessage = message.toLowerCase()

  // Arabic responses
  if (/[\u0600-\u06FF]/.test(message)) {
    if (lowerMessage.includes("مرحب") || lowerMessage.includes("سلام") || lowerMessage.includes("هلا")) {
      return "مرحباً بك في iCore! كيف يمكنني مساعدتك اليوم؟"
    }
    if (lowerMessage.includes("ساعد") || lowerMessage.includes("مساعدة")) {
      return "بالتأكيد! أنا هنا لمساعدتك. يمكنك طرح أسئلتك أو طلب المعلومات التي تحتاجها."
    }
    if (lowerMessage.includes("شكر")) {
      return "العفو! سعيد بخدمتك. هل هناك شيء آخر يمكنني مساعدتك به؟"
    }
    if (lowerMessage.includes("كيف حالك") || lowerMessage.includes("كيفك")) {
      return "أنا بخير، شكراً! كيف يمكنني مساعدتك؟"
    }
    return "شكراً لتواصلك معنا! فريقنا سيرد عليك قريباً. هل يمكنني مساعدتك بشيء آخر؟"
  }

  // English responses
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! Welcome to iCore. How can I help you today?"
  }
  if (lowerMessage.includes("help")) {
    return "I'm here to help! Feel free to ask any questions or let me know what you need."
  }
  if (lowerMessage.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?"
  }
  if (lowerMessage.includes("how are you")) {
    return "I'm doing great, thank you! How can I assist you?"
  }

  return "Thank you for your message! Our team will get back to you shortly. Is there anything else I can help you with?"
}

// Webhook endpoint for Telegram
app.post("/webhook/telegram", async (req, res) => {
  try {
    const update = req.body
    console.log("[INFO] Received Telegram update:", JSON.stringify(update, null, 2))

    if (!update.message) {
      return res.status(200).json({ ok: true })
    }

    const message = update.message
    const chatId = message.chat.id.toString()
    const userId = message.from.id.toString()
    const username = message.from.username || message.from.first_name || "User"
    const text = message.text || ""

    console.log(`[INFO] Message from ${username} (${userId}): ${text}`)

    // Check if user is linked to a profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("telegram_id", userId).single()

    // Save incoming message to telegram_messages
    await supabase.from("telegram_messages").insert({
      telegram_user_id: userId,
      telegram_chat_id: chatId,
      username: username,
      message: text,
      direction: "incoming",
    })

    // If profile exists and has telegram_chat_id different, update it
    if (profile && profile.telegram_chat_id !== chatId) {
      await supabase.from("profiles").update({ telegram_chat_id: chatId }).eq("id", profile.id)
      console.log("[INFO] Updated telegram_chat_id for profile:", profile.id)
    }

    // Save to telegram_admin_messages for admin dashboard
    await supabase.from("telegram_admin_messages").insert({
      telegram_user_id: userId,
      telegram_username: username,
      telegram_chat_id: chatId,
      message_text: text,
      is_read: false,
    })

    // If user is linked, save to their chat session
    if (profile) {
      // Get or create chat session
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)

      let sessionId = sessions?.[0]?.id

      if (!sessionId) {
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({ user_id: profile.id, title: "Telegram Chat" })
          .select()
          .single()
        sessionId = newSession?.id
      }

      // Save user message
      if (sessionId) {
        await supabase.from("messages").insert({
          session_id: sessionId,
          user_id: profile.id,
          content: text,
          role: "user",
        })
      }

      // Generate AI response
      const aiResponse = generateAIResponse(text)

      // Send AI response
      const sent = await sendTelegramMessage(chatId, aiResponse)

      if (sent && sessionId) {
        // Save AI response to messages
        await supabase.from("messages").insert({
          session_id: sessionId,
          user_id: profile.id,
          content: aiResponse,
          role: "assistant",
        })

        // Save to telegram_messages
        await supabase.from("telegram_messages").insert({
          telegram_user_id: userId,
          telegram_chat_id: chatId,
          username: "iCore AI",
          message: aiResponse,
          direction: "outgoing",
        })

        console.log("[SUCCESS] AI response sent and saved")
      }
    } else {
      // User not linked - send link instructions
      const linkMessage = `👋 مرحباً بك في iCore!\n\nيرجى ربط حسابك من:\nhttps://icore.life/dashboard/settings\n\n---\n\nWelcome to iCore!\n\nPlease link your account at:\nhttps://icore.life/dashboard/settings`
      await sendTelegramMessage(chatId, linkMessage)

      await supabase.from("telegram_messages").insert({
        telegram_user_id: userId,
        telegram_chat_id: chatId,
        username: "iCore Bot",
        message: linkMessage,
        direction: "outgoing",
      })

      console.log("[INFO] Sent link instructions to unlinked user")
    }

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error("[ERROR] Webhook error:", error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Send message from admin (website to Telegram)
app.post("/api/send-message", async (req, res) => {
  try {
    const { chatId, message } = req.body

    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        error: "chatId and message are required",
      })
    }

    console.log(`[INFO] Sending admin message to chat ${chatId}`)

    const sent = await sendTelegramMessage(chatId, message)

    if (sent) {
      // Save to database
      await supabase.from("telegram_messages").insert({
        telegram_chat_id: chatId,
        username: "Admin",
        message: message,
        direction: "outgoing",
        created_at: new Date().toISOString(),
      })

      console.log("[SUCCESS] Admin message sent")
      res.json({ success: true })
    } else {
      res.status(500).json({ success: false, error: "Failed to send message" })
    }
  } catch (error) {
    console.error("[ERROR] Send message error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: SUPABASE_URL,
    telegram: "configured",
  })
})

// Setup webhook endpoint
app.post("/setup-webhook", async (req, res) => {
  try {
    const { webhookUrl } = req.body

    if (!webhookUrl) {
      return res.status(400).json({ success: false, error: "webhookUrl is required" })
    }

    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("[SUCCESS] Webhook set to:", webhookUrl)
      res.json({ success: true, message: "Webhook configured successfully" })
    } else {
      console.error("[ERROR] Webhook setup failed:", data)
      res.status(500).json({ success: false, error: data.description })
    }
  } catch (error) {
    console.error("[ERROR] Setup webhook error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     iCore Telegram Bot Server Started     ║
╚═══════════════════════════════════════════╝

[INFO] Server running on port ${PORT}
[INFO] Webhook endpoint: http://YOUR_IP:${PORT}/webhook/telegram
[INFO] Health check: http://YOUR_IP:${PORT}/health
[INFO] Ready to receive messages!

To setup webhook, send POST to /setup-webhook with:
{
  "webhookUrl": "http://YOUR_IP:${PORT}/webhook/telegram"
}
  `)
})

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("[INFO] SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("[INFO] SIGINT received, shutting down gracefully")
  process.exit(0)
})
