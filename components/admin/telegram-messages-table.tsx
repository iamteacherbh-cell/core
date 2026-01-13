"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Check, Clock, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"

interface TelegramMessage {
  id: string
  telegram_user_id: string
  telegram_username: string
  telegram_chat_id: string
  message_text: string
  reply_text: string | null
  replied_at: string | null
  created_at: string
  is_read: boolean
}

export function TelegramMessagesTable() {
  const { language } = useLanguage()
  const t = useTranslation(language)
  const [messages, setMessages] = useState<TelegramMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/telegram/admin/messages")
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("[v0] Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const handleReply = async (messageId: string, telegramUserId: string) => {
    if (!replyText.trim()) return

    setSending(true)
    try {
      const response = await fetch("/api/telegram/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          replyText,
          telegramUserId,
        }),
      })

      if (response.ok) {
        setReplyText("")
        setReplyingTo(null)
        fetchMessages()
      } else {
        alert(t.error)
      }
    } catch (error) {
      console.error("[v0] Error sending reply:", error)
      alert(t.error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">{t.loading}</div>
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  const groupedMessages = messages.reduce(
    (acc, message) => {
      if (!acc[message.telegram_user_id]) {
        acc[message.telegram_user_id] = []
      }
      acc[message.telegram_user_id].push(message)
      return acc
    },
    {} as Record<string, TelegramMessage[]>,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="secondary">
          {language === "ar" ? "إجمالي الرسائل" : "Total Messages"}: {messages.length}
        </Badge>
        {unreadCount > 0 && (
          <Badge variant="destructive">
            {t.unreadMessages}: {unreadCount}
          </Badge>
        )}
        <Badge variant="outline">
          <User className="h-3 w-3 mr-1" />
          {language === "ar" ? "المستخدمين" : "Users"}: {Object.keys(groupedMessages).length}
        </Badge>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">{t.noMessages}</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([userId, userMessages]) => (
            <Card key={userId} className="border-2">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5" />@{userMessages[0].telegram_username}
                    </CardTitle>
                    <CardDescription>
                      {language === "ar" ? "معرف المستخدم" : "User ID"}: {userId}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {userMessages.length} {language === "ar" ? "رسالة" : "messages"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {userMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`space-y-3 pb-4 ${!message.is_read ? "border-l-4 border-primary pl-4" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: language === "ar" ? ar : enUS,
                        })}
                      </p>
                      {message.is_read ? (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {language === "ar" ? "مقروء" : "Read"}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {language === "ar" ? "جديد" : "New"}
                        </Badge>
                      )}
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                    </div>

                    {message.reply_text && (
                      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium mb-1">{language === "ar" ? "ردك:" : "Your reply:"}</p>
                        <p className="text-sm whitespace-pre-wrap">{message.reply_text}</p>
                        {message.replied_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t.repliedAt}{" "}
                            {formatDistanceToNow(new Date(message.replied_at), {
                              addSuffix: true,
                              locale: language === "ar" ? ar : enUS,
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {replyingTo === message.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={language === "ar" ? "اكتب ردك هنا..." : "Type your reply here..."}
                          rows={3}
                          className={language === "ar" ? "text-right" : ""}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleReply(message.id, message.telegram_user_id)} disabled={sending}>
                            <Send className="h-4 w-4 mr-2" />
                            {t.sendReply}
                          </Button>
                          <Button variant="outline" onClick={() => setReplyingTo(null)}>
                            {language === "ar" ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      !message.reply_text && (
                        <Button onClick={() => setReplyingTo(message.id)} variant="outline" size="sm">
                          {t.replyTo}
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
