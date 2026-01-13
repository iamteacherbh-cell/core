'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { useSupabaseUser } from '@/app/providers' // === تحديث: استيراد الـ Hook الجديد
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Copy,
  Check
} from "lucide-react"
import { createClient } from '@/lib/supabase/client' // === تغيير: استيراد العميل الجديد

// === تعديل: إنشاء العميل داخل المكون
const supabase = createClient();

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export default function AiChatPage() {
  const { user, isLoading } = useSupabaseUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // جلب سجل المحادثات عند تحميل الصفحة
  useEffect(() => {
    if (user) {
      // هنا يمكنك إضافة منطق لجلب سجل المحادثات من قاعدة البيانات
      // مثال:
      // fetchChatHistory(user.id)
    }
  }, [user])

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoadingResponse || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoadingResponse(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // === ملاحظة: لا حاجة لإرسال التوكن يدويًا
          // ملف الـ API سيقرأه من الكوكيز تلقائيًا
        },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        role: 'assistant',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error: any) {
      console.error("Error sending message:", error)
      // يمكنك عرض رسالة خطأ للمستخدم هنا
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `عذرًا، حدث خطأ: ${error.message}`,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoadingResponse(false)
    }
  }, [input, isLoadingResponse, user])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="h-12 w-12 mb-4" />
            <p>ابدأ محادثة جديدة مع مساعد الذكاء الاصطناعي</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && <Bot className="h-8 w-8 rounded-full p-1 bg-primary text-primary-foreground" />}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="absolute -top-2 -right-2 p-1 bg-background border rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy message"
                >
                  {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              {message.role === 'user' && <User className="h-8 w-8 rounded-full p-1 bg-secondary" />}
            </div>
          ))
        )}
        {isLoadingResponse && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground">يفكر...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoadingResponse}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoadingResponse}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
