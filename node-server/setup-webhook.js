// Quick script to setup Telegram webhook
import fetch from "node-fetch"
import dotenv from "dotenv"

dotenv.config()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SERVER_IP = "51.75.118.170"
const SERVER_PORT = "20166"
const WEBHOOK_URL = `http://${SERVER_IP}:${SERVER_PORT}/webhook/telegram`

console.log("Setting up Telegram webhook...")
console.log("Webhook URL:", WEBHOOK_URL)

const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: WEBHOOK_URL }),
})

const data = await response.json()

if (data.ok) {
  console.log("✓ Webhook setup successful!")
  console.log("Your bot is now ready to receive messages")
} else {
  console.error("✗ Webhook setup failed!")
  console.error("Error:", data.description)
}

// Check webhook info
const infoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
const infoData = await infoResponse.json()

console.log("\nWebhook Info:")
console.log(JSON.stringify(infoData.result, null, 2))
