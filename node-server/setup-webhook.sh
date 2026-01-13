#!/bin/bash

# iCore Telegram Webhook Setup Script

echo "╔═══════════════════════════════════════════╗"
echo "║   iCore Telegram Webhook Setup Script    ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Bot Token
BOT_TOKEN="8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os"

# Server details
SERVER_IP="51.75.118.170"
SERVER_PORT="20166"
WEBHOOK_URL="http://${SERVER_IP}:${SERVER_PORT}/webhook/telegram"

echo "🔧 Setting up webhook..."
echo "📍 Webhook URL: ${WEBHOOK_URL}"
echo ""

# Set webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\"}")

echo "📥 Response:"
echo $RESPONSE | python3 -m json.tool 2>/dev/null || echo $RESPONSE
echo ""

# Get webhook info
echo "🔍 Verifying webhook..."
sleep 2

INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo $INFO | python3 -m json.tool 2>/dev/null || echo $INFO
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Open Telegram and search for @icore2_bot"
echo "2. Send a message to test"
echo "3. Check server logs in KataBump Console"
