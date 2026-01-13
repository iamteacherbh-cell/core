// Test if environment variables are loading correctly
import dotenv from "dotenv"

console.log("Testing environment variables...")
dotenv.config()

console.log("\n=== Environment Variables ===")
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Loaded" : "✗ Missing")
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Loaded" : "✗ Missing")
console.log("TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? "✓ Loaded" : "✗ Missing")
console.log("PORT:", process.env.PORT || "3001 (default)")

console.log("\n=== Full Values ===")
console.log("SUPABASE_URL:", process.env.SUPABASE_URL)
console.log("TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN)
console.log("\nIf all variables show '✓ Loaded', your .env file is working correctly!")
