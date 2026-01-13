"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, User, MessageCircle, CheckCheck, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  telegram_user_id: string
  telegram_username: string
  telegram_chat_id: string
  message_text: string
  reply_text: string | null
  is_read: boolean
  replied_at: string | null
  created_at: string
}

interface Conversation {
  userId: string
  username: string
  chatId: string
  messages: Message[]
  unreadCount: number
  lastMessage: Message
}

interface TelegramConversationsManagerProps {
  conversations: Conversation[]
}

export function TelegramConversationsManager({
  conversations: initialConversations,
}: TelegramConversationsManagerProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || isSending) return

    setIsSending(true)
    setError(null)

    try {
      // Send via Node.js server
      const response = await fetch("http://51.75.118.170:3001/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedConversation.chatId,
          message: replyText,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      // Update local state
      const updatedConversations = conversations.map((conv) => {
        if (conv.userId === selectedConversation.userId) {
          const newMessage: Message = {
            id: crypto.randomUUID(),
            telegram_user_id: conv.userId,
            telegram_username: "Admin",
            telegram_chat_id: conv.chatId,
            message_text: replyText,
            reply_text: null,
            is_read: true,
            replied_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: newMessage,
          }
        }
        return conv
      })

      setConversations(updatedConversations)
      setSelectedConversation(updatedConversations.find((c) => c.userId === selectedConversation.userId) || null)
      setReplyText("")
    } catch (err) {
      console.error("Error sending reply:", err)
      setError("فشل إرسال الرسالة. تأكد من تشغيل السيرفر.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      {/* Conversations List */}
      <Card className="md:col-span-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          المحادثات
        </h2>

        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد محادثات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.userId}
                onClick={() => setSelectedConversation(conversation)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent",
                  selectedConversation?.userId === conversation.userId && "bg-accent border-primary",
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-sm">{conversation.username}</span>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {conversation.lastMessage?.message_text || "No messages"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(conversation.lastMessage?.created_at).toLocaleString("ar-BH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">{selectedConversation.username}</h3>
                  <p className="text-xs text-muted-foreground">Chat ID: {selectedConversation.chatId}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-2", message.telegram_username === "Admin" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      message.telegram_username === "Admin" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                    <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                      {new Date(message.created_at).toLocaleString("ar-BH", {
                        timeStyle: "short",
                      })}
                      {message.telegram_username === "Admin" && <CheckCheck className="h-3 w-3" />}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Reply Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك هنا... / Type your reply here..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendReply()
                    }
                  }}
                />
                <Button onClick={handleSendReply} disabled={isSending || !replyText.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">💡 سيتم إرسال الرسالة مباشرة إلى Telegram</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>اختر محادثة لعرضها</p>
              <p className="text-sm mt-1">Select a conversation to view</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
