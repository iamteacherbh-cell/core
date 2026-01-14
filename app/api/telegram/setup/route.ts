import { NextResponse } from "next/server"
import { 
  setTelegramWebhook, 
  getTelegramWebhookInfo, 
  deleteTelegramWebhook,
  getTelegramBotInfo 
} from "@/lib/telegram"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let action = searchParams.get('action')

    // --- التعديل الرئيسي ---
    // إذا لم يتم العثور على action في الرابط، ابحث في جسم الطلب
    if (!action) {
      const body = await request.json();
      action = body.action;
    }
    // --- نهاية التعديل ---
    
    console.log(`[TELEGRAM-SETUP] Action requested: ${action}`)
    
    switch (action) {
      case 'set':
        const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://icore.life'
        const fullUrl = `${webhookUrl}/api/telegram/webhook`
        
        const setResult = await setTelegramWebhook(fullUrl)
        
        return NextResponse.json({
          success: setResult.ok,
          action: 'set_webhook',
          url: fullUrl,
          result: setResult
        })
      
      case 'info':
        const webhookInfo = await getTelegramWebhookInfo()
        const botInfo = await getTelegramBotInfo()
        
        return NextResponse.json({
          success: true,
          action: 'get_info',
          webhook_info: webhookInfo,
          bot_info: botInfo,
          timestamp: new Date().toISOString()
        })
      
      case 'delete':
        const deleteResult = await deleteTelegramWebhook()
        
        return NextResponse.json({
          success: deleteResult.ok,
          action: 'delete_webhook',
          result: deleteResult
        })
      
      case 'test':
        const testInfo = await getTelegramBotInfo()
        
        return NextResponse.json({
          success: testInfo.ok,
          action: 'test_connection',
          bot_info: testInfo,
          status: testInfo.ok ? 'Bot is active' : 'Bot connection failed'
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: `The action "${action}" is not supported.`,
          available_actions: ['set', 'info', 'delete', 'test']
        }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error("[TELEGRAM-SETUP] Error:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      action: 'error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'info'
    
    // جلب معلومات البوت
    const botInfo = await getTelegramBotInfo()
    
    // جلب معلومات Webhook
    const webhookInfo = await getTelegramWebhookInfo()
    
    return NextResponse.json({
      success: true,
      bot: {
        id: botInfo.result?.id,
        username: botInfo.result?.username,
        first_name: botInfo.result?.first_name,
        is_active: botInfo.ok
      },
      webhook: {
        url: webhookInfo.result?.url,
        has_custom_certificate: webhookInfo.result?.has_custom_certificate,
        pending_update_count: webhookInfo.result?.pending_update_count,
        max_connections: webhookInfo.result?.max_connections,
        ip_address: webhookInfo.result?.ip_address,
        last_error_date: webhookInfo.result?.last_error_date,
        last_error_message: webhookInfo.result?.last_error_message,
        last_synchronization_error_date: webhookInfo.result?.last_synchronization_error_date
      },
      endpoints: {
        webhook: '/api/telegram/webhook',
        setup: '/api/telegram/setup',
        generate_link: '/api/telegram/generate-link',
        messages: '/api/telegram/messages'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error("[TELEGRAM-SETUP] GET Error:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
