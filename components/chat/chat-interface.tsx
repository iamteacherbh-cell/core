"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  created_at: string
}

interface ChatInterfaceProps {
  sessionId: string
  userId: string
  initialMessages: Message[]
  userLanguage?: string
}

export function ChatInterface({ sessionId, userId, initialMessages, userLanguage = "en" }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput("")
    setLoading(true)

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      role: "user",
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userId,
          content: userMessage,
        }),
      })

      const data = await response.json()

      if (data.success && data.userMessage && data.assistantMessage) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id)
          return [...withoutTemp, data.userMessage, data.assistantMessage]
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
            <Bot className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base md:text-lg font-medium mb-2">
              {userLanguage === "ar" ? "مرحباً! كيف يمكنني مساعدتك؟" : "Hello! How can I help you?"}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              {userLanguage === "ar"
                ? "اسألني أي شيء عن التواصل المهني"
                : "Ask me anything about professional networking"}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex gap-2 sm:gap-3 items-start", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role === "assistant" && (
              <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0 mt-1">
                <AvatarFallback className="bg-primary">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                "rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <p className="text-xs sm:text-sm md:text-base whitespace-pre-wrap text-pretty break-words">
                {message.content}
              </p>
            </div>

            {message.role === "user" && (
              <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0 mt-1">
                <AvatarFallback className="bg-secondary">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 sm:gap-3 justify-start items-start">
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0 mt-1">
              <AvatarFallback className="bg-primary">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground animate-spin" />
              </AvatarFallback>
            </Avatar>
            <div className="rounded-lg px-3 py-2 bg-muted">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-muted-foreground rounded-full animate-bounce" />
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="border-t p-2 sm:p-3 md:p-4 bg-background"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={userLanguage === "ar" ? "اكتب رسالتك..." : "Type your message..."}
            disabled={loading}
            className={cn("text-xs sm:text-sm flex-1 h-9 sm:h-10", userLanguage === "ar" && "text-right")}
          />
          <Button type="submit" size="sm" disabled={loading || !input.trim()} className="h-9 sm:h-10 px-3 sm:px-4">
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </form>
    </Card>
  )
}
