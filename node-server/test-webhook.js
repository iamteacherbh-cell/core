// Test webhook setup for iCore Telegram Bot

const BOT_TOKEN = "8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os"
const SERVER_IP = "51.75.118.170"
const SERVER_PORT = "20166"
const WEBHOOK_URL = `http://${SERVER_IP}:${SERVER_PORT}/webhook/telegram`

console.log("╔═══════════════════════════════════════════╗")
console.log("║   Testing iCore Telegram Webhook         ║")
console.log("╚═══════════════════════════════════════════╝\n")

async function testWebhook() {
  try {
    // 1. Get current webhook info
    console.log("1️⃣  Checking current webhook...")
    const infoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    const info = await infoResponse.json()
    console.log("   Current webhook:", info.result.url || "Not set")
    console.log("   Pending updates:", info.result.pending_update_count)
    console.log("")

    // 2. Set webhook
    console.log("2️⃣  Setting webhook to:", WEBHOOK_URL)
    const setResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: WEBHOOK_URL }),
    })
    const setResult = await setResponse.json()

    if (setResult.ok) {
      console.log("   ✅ Webhook set successfully!")
    } else {
      console.log("   ❌ Failed:", setResult.description)
    }
    console.log("")

    // 3. Verify webhook
    console.log("3️⃣  Verifying webhook...")
    const verifyResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    const verifyInfo = await verifyResponse.json()
    console.log("   Webhook URL:", verifyInfo.result.url)
    console.log("   Last error:", verifyInfo.result.last_error_message || "None")
    console.log("")

    // 4. Test server health
    console.log("4️⃣  Testing server health...")
    try {
      const healthResponse = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/health`)
      const health = await healthResponse.json()
      console.log("   ✅ Server is running!")
      console.log("   Status:", health.status)
    } catch (error) {
      console.log("   ❌ Server is not reachable")
      console.log("   Error:", error.message)
    }
    console.log("")

    console.log("╔═══════════════════════════════════════════╗")
    console.log("║   Test Complete!                          ║")
    console.log("╚═══════════════════════════════════════════╝")
    console.log("")
    console.log("📝 Next steps:")
    console.log("1. Open Telegram app")
    console.log("2. Search for @icore2_bot")
    console.log("3. Send a message: مرحبا")
    console.log("4. Check server logs in KataBump Console")
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

testWebhook()
