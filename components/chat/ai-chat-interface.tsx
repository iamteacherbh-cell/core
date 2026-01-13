"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiChatInterfaceProps {
  userId: string
  language: string
}

export function AiChatInterface({ userId, language }: AiChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/ai/chat/history?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error("Error loading chat history:", error)
      }
    }
    loadHistory()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: input }],
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      } else {
        console.error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Card className="flex-1 overflow-hidden flex flex-col min-h-0 shadow-lg">
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
              <Bot className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base md:text-lg font-medium mb-2">
                {language === "ar" ? "مرحباً! كيف يمكنني مساعدتك اليوم؟" : "Hello! How can I help you today?"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                {language === "ar"
                  ? "اسألني أي شيء عن التواصل المهني والعلاقات التجارية"
                  : "Ask me anything about professional networking and business connections"}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 sm:gap-3 items-start",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 mt-1">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.parts?.map((part: any, index: number) => {
                  if (part.type === "text") {
                    return (
                      <p
                        key={index}
                        className="text-xs sm:text-sm md:text-base whitespace-pre-wrap text-pretty break-words"
                      >
                        {part.text}
                      </p>
                    )
                  }
                  return null
                })}
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 mt-1">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-secondary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 sm:gap-3 justify-start items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary-foreground animate-spin" />
                </div>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {language === "ar" ? "يكتب..." : "Typing..."}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-2 sm:p-3 md:p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === "ar" ? "اكتب رسالتك هنا..." : "Type your message here..."}
              disabled={isLoading}
              className={cn("text-xs sm:text-sm flex-1 h-9 sm:h-10", language === "ar" && "text-right")}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="h-9 sm:h-10 px-3 sm:px-4">
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
