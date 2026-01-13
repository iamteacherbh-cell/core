import { createServerClient } from "@/lib/supabase/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os"
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// ============= الدوال الرئيسية =============

export async function sendTelegramMessage({
  chat_id,
  text,
  parse_mode = "Markdown",
  user_id = null,
  username = null,
  additional_data = {}
}: {
  chat_id: string | number
  text: string
  parse_mode?: string
  user_id?: string | null
  username?: string | null
  additional_data?: any
}) {
  try {
    console.log(`[TELEGRAM] Sending to ${chat_id}: ${text.substring(0, 50)}...`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error(`[TELEGRAM] API error:`, result)
      throw new Error(result.description || `HTTP ${response.status}`)
    }

    // حفظ الرسالة في قاعدة البيانات
    const supabase = await createServerClient()
    
    const messageData: any = {
      telegram_chat_id: chat_id.toString(),
      message: `${text} | parse_mode: ${parse_mode} | status: sent`,
      direction: 'outgoing',
      created_at: new Date().toISOString()
    }
    
    if (user_id) {
      messageData.telegram_user_id = user_id.toString()
    }
    
    if (username) {
      messageData.username = username
    }
    
    if (Object.keys(additional_data).length > 0) {
      messageData.message += ` | data: ${JSON.stringify(additional_data)}`
    }
    
    await supabase.from("telegram_messages").insert(messageData)

    console.log(`[TELEGRAM] Message sent successfully, message_id: ${result.result?.message_id}`)
    return {
      success: true,
      message_id: result.result?.message_id,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to send message:", error)
    
    try {
      const supabase = await createServerClient()
      
      const errorData: any = {
        telegram_chat_id: chat_id.toString(),
        message: `${text} | parse_mode: ${parse_mode} | status: failed | error: ${error.message}`,
        direction: 'outgoing',
        created_at: new Date().toISOString()
      }
      
      if (user_id) {
        errorData.telegram_user_id = user_id.toString()
      }
      
      if (username) {
        errorData.username = username
      }
      
      await supabase.from("telegram_messages").insert(errorData)
    } catch (dbError) {
      console.error("[TELEGRAM] Failed to save error to DB:", dbError)
    }
    
    // محاولة إرسال بدون Markdown إذا كان هناك خطأ في التنسيق
    if (error.message?.includes('Markdown') || error.message?.includes('parse_mode')) {
      try {
        console.log("[TELEGRAM] Retrying without Markdown formatting...")
        const plainText = text.replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '')
        
        const retryResponse = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id,
            text: plainText,
            parse_mode: null
          }),
        })
        
        const retryResult = await retryResponse.json()
        
        if (retryResponse.ok) {
          console.log("[TELEGRAM] Message sent successfully without Markdown")
          
          // حفظ في قاعدة البيانات
          const supabase = await createServerClient()
          await supabase.from("telegram_messages").insert({
            telegram_chat_id: chat_id.toString(),
            telegram_user_id: user_id?.toString(),
            username,
            message: `${text} | parse_mode: plain | status: sent_retry`,
            direction: 'outgoing',
            created_at: new Date().toISOString()
          })
          
          return {
            success: true,
            message_id: retryResult.result?.message_id,
            ...retryResult
          }
        }
      } catch (retryError) {
        console.error("[TELEGRAM] Retry also failed:", retryError)
      }
    }
    
    return {
      success: false,
      error: error.message,
      original_error: error
    }
  }
}

// ============= إدارة Webhook =============

export async function setTelegramWebhook(url: string) {
  try {
    console.log(`[TELEGRAM] Setting webhook to: ${url}`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    const result = await response.json()
    console.log(`[TELEGRAM] Webhook set result:`, result)
    return {
      success: result.ok,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to set webhook:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getTelegramWebhookInfo() {
  try {
    console.log(`[TELEGRAM] Getting webhook info`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`)
    const result = await response.json()
    
    console.log(`[TELEGRAM] Webhook info:`, result)
    return {
      success: result.ok,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to get webhook info:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function deleteTelegramWebhook() {
  try {
    console.log(`[TELEGRAM] Deleting webhook`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
      method: "POST",
    })

    const result = await response.json()
    console.log(`[TELEGRAM] Webhook delete result:`, result)
    return {
      success: result.ok,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to delete webhook:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============= معلومات البوت =============

export async function getTelegramBotInfo() {
  try {
    console.log(`[TELEGRAM] Getting bot info`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`)
    const data = await response.json()
    
    console.log("[TELEGRAM] Bot info:", data)
    return {
      success: data.ok,
      bot: data.result,
      ...data
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to get bot info:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getTelegramUpdates(offset = 0, limit = 10) {
  try {
    console.log(`[TELEGRAM] Getting updates, offset: ${offset}`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${offset}&limit=${limit}`)
    const data = await response.json()
    
    console.log(`[TELEGRAM] Updates received: ${data.result?.length || 0}`)
    return {
      success: data.ok,
      updates: data.result || [],
      ...data
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to get updates:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============= دوال الإرسال المتخصصة =============

export async function sendTelegramMessageToUser({
  chat_id,
  text,
  user_id = null,
  username = null,
  parse_mode = "Markdown"
}: {
  chat_id: string | number
  text: string
  user_id?: string | null
  username?: string | null
  parse_mode?: string
}) {
  return await sendTelegramMessage({
    chat_id,
    text,
    parse_mode,
    user_id,
    username,
    additional_data: { type: 'user_message' }
  })
}

export async function sendTelegramNotification({
  chat_id,
  text,
  user_id = null,
  username = null
}: {
  chat_id: string | number
  text: string
  user_id?: string | null
  username?: string | null
}) {
  return await sendTelegramMessage({
    chat_id,
    text,
    parse_mode: "Markdown",
    user_id,
    username,
    additional_data: { type: 'notification' }
  })
}

export async function sendTelegramWelcomeMessage({
  chat_id,
  user_id,
  username,
  name
}: {
  chat_id: string | number
  user_id: string
  username?: string | null
  name?: string | null
}) {
  const message = name 
    ? `مرحباً ${name}! 👋\n\n✅ تم ربط حسابك بنجاح مع iCore.\n\nيمكنك الآن:\n• إرسال رسائل وسيتم حفظها في حسابك\n• استلام إشعارات هامة\n• التواصل مع الدعم\n\n📱 [افتح حسابك](https://icore.life/dashboard)`
    : `مرحباً! 👋\n\n✅ تم ربط حسابك بنجاح مع iCore.\n\nيمكنك الآن:\n• إرسال رسائل وسيتم حفظها في حسابك\n• استلام إشعارات هامة\n• التواصل مع الدعم\n\n📱 [افتح حسابك](https://icore.life/dashboard)`
  
  return await sendTelegramMessage({
    chat_id,
    text: message,
    parse_mode: "Markdown",
    user_id,
    username,
    additional_data: { type: 'welcome_message' }
  })
}

export async function sendTelegramAdminMessage({
  chat_id,
  text,
  admin_name = "الإدارة"
}: {
  chat_id: string | number
  text: string
  admin_name?: string
}) {
  return await sendTelegramMessage({
    chat_id,
    text: `📨 *رسالة من ${admin_name}*\n\n${text}\n\n💬 للرد، أرسل رسالة إلى البوت.`,
    parse_mode: "Markdown",
    additional_data: { type: 'admin_message', admin_name }
  })
}

// ============= دوال إضافية =============

export async function sendTelegramPhoto({
  chat_id,
  photo_url,
  caption = "",
  user_id = null,
  username = null
}: {
  chat_id: string | number
  photo_url: string
  caption?: string
  user_id?: string | null
  username?: string | null
}) {
  try {
    console.log(`[TELEGRAM] Sending photo to ${chat_id}`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id,
        photo: photo_url,
        caption,
        parse_mode: "Markdown"
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error(`[TELEGRAM] Photo API error:`, result)
      throw new Error(result.description || `HTTP ${response.status}`)
    }

    // حفظ في قاعدة البيانات
    const supabase = await createServerClient()
    await supabase.from("telegram_messages").insert({
      telegram_chat_id: chat_id.toString(),
      telegram_user_id: user_id?.toString(),
      username,
      message: `[PHOTO] ${photo_url} | Caption: ${caption}`,
      direction: 'outgoing',
      created_at: new Date().toISOString()
    })

    console.log(`[TELEGRAM] Photo sent successfully`)
    return {
      success: true,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to send photo:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function sendTelegramDocument({
  chat_id,
  document_url,
  caption = "",
  user_id = null,
  username = null
}: {
  chat_id: string | number
  document_url: string
  caption?: string
  user_id?: string | null
  username?: string | null
}) {
  try {
    console.log(`[TELEGRAM] Sending document to ${chat_id}`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/sendDocument`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id,
        document: document_url,
        caption,
        parse_mode: "Markdown"
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error(`[TELEGRAM] Document API error:`, result)
      throw new Error(result.description || `HTTP ${response.status}`)
    }

    // حفظ في قاعدة البيانات
    const supabase = await createServerClient()
    await supabase.from("telegram_messages").insert({
      telegram_chat_id: chat_id.toString(),
      telegram_user_id: user_id?.toString(),
      username,
      message: `[DOCUMENT] ${document_url} | Caption: ${caption}`,
      direction: 'outgoing',
      created_at: new Date().toISOString()
    })

    console.log(`[TELEGRAM] Document sent successfully`)
    return {
      success: true,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to send document:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============= دوال الإدارة =============

export async function getTelegramChatInfo(chat_id: string | number) {
  try {
    console.log(`[TELEGRAM] Getting chat info for ${chat_id}`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/getChat?chat_id=${chat_id}`)
    const result = await response.json()
    
    console.log(`[TELEGRAM] Chat info:`, result)
    return {
      success: result.ok,
      chat: result.result,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to get chat info:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getTelegramChatMembersCount(chat_id: string | number) {
  try {
    console.log(`[TELEGRAM] Getting members count for ${chat_id}`)
    
    const response = await fetch(`${TELEGRAM_API_URL}/getChatMembersCount?chat_id=${chat_id}`)
    const result = await response.json()
    
    console.log(`[TELEGRAM] Members count:`, result)
    return {
      success: result.ok,
      count: result.result,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to get members count:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============= دوال المساعدة =============

export function formatTelegramMessage(text: string, type: 'markdown' | 'html' | 'plain' = 'markdown') {
  if (type === 'plain') {
    return text.replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '')
  }
  
  if (type === 'html') {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  }
  
  return text
}

export function escapeMarkdown(text: string): string {
  return text
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\~/g, '\\~')
    .replace(/\`/g, '\\`')
    .replace(/\>/g, '\\>')
    .replace(/\#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/\-/g, '\\-')
    .replace(/\=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/\!/g, '\\!')
}

// ============= إدارة Webhook آمن =============

export async function setWebhookWithSecret(webhookUrl: string, secretToken?: string) {
  try {
    const webhookData: any = {
      url: webhookUrl,
      max_connections: 40,
      allowed_updates: ["message", "channel_post", "callback_query"]
    }
    
    if (secretToken) {
      webhookData.secret_token = secretToken
    }
    
    console.log(`[TELEGRAM] Setting webhook with data:`, webhookData)
    
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    })

    const result = await response.json()
    console.log(`[TELEGRAM] Webhook set result:`, result)
    return {
      success: result.ok,
      ...result
    }

  } catch (error: any) {
    console.error("[TELEGRAM] Failed to set webhook with secret:", error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============= Export دوال المساعدة =============

export default {
  sendTelegramMessage,
  sendTelegramMessageToUser,
  sendTelegramNotification,
  sendTelegramWelcomeMessage,
  sendTelegramAdminMessage,
  sendTelegramPhoto,
  sendTelegramDocument,
  
  setTelegramWebhook,
  getTelegramWebhookInfo,
  deleteTelegramWebhook,
  setWebhookWithSecret,
  
  getTelegramBotInfo,
  getTelegramUpdates,
  getTelegramChatInfo,
  getTelegramChatMembersCount,
  
  formatTelegramMessage,
  escapeMarkdown
}
