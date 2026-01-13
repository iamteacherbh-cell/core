import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TelegramConversationsManager } from "@/components/admin/telegram-conversations-manager"

export default async function TelegramConversationsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: conversations } = await supabase
    .from("telegram_admin_messages")
    .select("*")
    .order("created_at", { ascending: false })

  // Group messages by telegram_user_id
  const groupedConversations = conversations?.reduce(
    (acc, msg) => {
      if (!acc[msg.telegram_user_id]) {
        acc[msg.telegram_user_id] = {
          userId: msg.telegram_user_id,
          username: msg.telegram_username,
          chatId: msg.telegram_chat_id,
          messages: [],
          unreadCount: 0,
          lastMessage: null,
        }
      }
      acc[msg.telegram_user_id].messages.push(msg)
      if (!msg.is_read) {
        acc[msg.telegram_user_id].unreadCount++
      }
      if (
        !acc[msg.telegram_user_id].lastMessage ||
        new Date(msg.created_at) > new Date(acc[msg.telegram_user_id].lastMessage.created_at)
      ) {
        acc[msg.telegram_user_id].lastMessage = msg
      }
      return acc
    },
    {} as Record<string, any>,
  )

  const conversationsList = Object.values(groupedConversations || {})

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Telegram Conversations</h1>
        <p className="text-muted-foreground">محادثات تليجرام - إدارة جميع المحادثات مع المستخدمين</p>
      </div>

      <TelegramConversationsManager conversations={conversationsList} />
    </div>
  )
}
