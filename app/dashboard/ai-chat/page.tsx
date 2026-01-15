'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { useSupabaseUser } from '@/app/providers'
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Copy,
  Check
} from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const supabase = createClient();

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  sender_name?: string
  timestamp: Date
}

export default function AiChatPage() {
  const { user, isLoading } = useSupabaseUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1️⃣ جلب أو إنشاء الجلسة الحالية
  useEffect(() => {
    if (user) {
      const getOrCreateSession = async () => {
        const { data: session } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("user_id", user.id)
          .order("last_message_at", { ascending: false })
          .limit(1)
          .single();

        if (session) {
          setCurrentSessionId(session.id);
        } else {
          const { data: newSession } = await supabase
            .from("chat_sessions")
            .insert({
              user_id: user.id,
              title: "AI Chat",
              last_message_at: new Date().toISOString()
            })
            .select("id")
            .single();

          setCurrentSessionId(newSession?.id || null);
        }
      };
      getOrCreateSession();
    }
  }, [user]);

  // 2️⃣ جلب الرسائل الحالية
  useEffect(() => {
    if (currentSessionId) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const formatted = data.map((m) => ({
            id: m.id,
            content: m.content,
            role: m.role,
            sender_name: m.sender_name,
            timestamp: new Date(m.created_at)
          }));
          setMessages(formatted);
        }
      };
      fetchMessages();
    }
  }, [currentSessionId]);

  // 3️⃣ الاستماع للرسائل الجديدة في الوقت الفعلي
  useEffect(() => {
    if (!currentSessionId) return;

    const channel = supabase
      .channel(`messages:${currentSessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${currentSessionId}` },
        (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            role: payload.new.role,
            sender_name: payload.new.sender_name,
            timestamp: new Date(payload.new.created_at),
          };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 4️⃣ إرسال رسالة المستخدم
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoadingResponse || !user || !currentSessionId) return;

    const messageContent = input.trim();
    setInput("")
    setIsLoadingResponse(true)

    try {
      // حفظ رسالة المستخدم
      const { error: insertError } = await supabase.from('messages').insert({
        session_id: currentSessionId,
        user_id: user.id,
        role: 'user',
        content: messageContent,
        sender_name: user.user_metadata.full_name || 'User'
      });
      if (insertError) throw insertError;

      // إرسال الرسالة إلى قناة Telegram
      const CHANNEL_ID = "-1003583611128";
      await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: CHANNEL_ID,
          message: `مستخدم (${user.user_metadata.full_name || 'User'}): ${messageContent}`,
          isChannel: true
        }),
      });

    } catch (error: any) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `حدث خطأ: ${error.message}`,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoadingResponse(false)
    }
  }, [input, isLoadingResponse, user, currentSessionId]);

  // 5️⃣ نسخ الرسائل
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

  // 6️⃣ واجهة الدردشة
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
              {message.role === 'assistant' && (
                <Bot className="h-8 w-8 rounded-full p-1 bg-primary text-primary-foreground" />
              )}

              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.sender_name && (
                  <p className="text-[10px] opacity-70">{message.sender_name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="absolute -top-2 -right-2 p-1 bg-background border rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy message"
                >
                  {copiedId === message.id
                    ? <Check className="h-3 w-3" />
                    : <Copy className="h-3 w-3" />}
                </button>
              </div>

              {message.role === 'user' && (
                <User className="h-8 w-8 rounded-full p-1 bg-secondary" />
              )}
            </div>
          ))
        )}

        {isLoadingResponse && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground">يتم الإرسال...</p>
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
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك..."
            disabled={isLoadingResponse}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoadingResponse}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
