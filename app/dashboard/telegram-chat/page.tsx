"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Send, 
  User, 
  Clock, 
  MessageSquare, 
  Check, 
  RefreshCw,
  Filter,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Loader2
} from "lucide-react"
import { toast } from "sonner"



interface TelegramUser {
  id: string
  full_name?: string
  email: string
  telegram_chat_id: string
  telegram_username?: string
  language?: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
}

interface ChatMessage {
  id: string
  user_id: string
  content: string
  role: 'user' | 'admin' | 'assistant'
  created_at: string
  telegram_message_id?: string
  telegram_chat_id?: string
  sender_name?: string
}

export default function TelegramChatPage() {
  const [users, setUsers] = useState<TelegramUser[]>([])
  const [selectedUser, setSelectedUser] = useState<TelegramUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient();

  // ============= تحديث: دالة جلب المستخدمين (مباشرة من Supabase) =============
  const loadUsers = async () => {
    setLoading(true)
    try {
      // نحصل على المستخدمين الذين لديهم telegram_chat_id ونرتبهم حسب آخر رسالة
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('telegram_chat_id', 'is', null)
        .order('last_message_sent_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      setUsers(data || [])
    } catch (error: any) {
      toast.error(error.message || "فشل في تحميل المستخدمين")
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  // ============= تحديث: دالة جلب رسائل مستخدم (مباشرة من Supabase) =============
  const loadUserMessages = async (user: TelegramUser) => {
    if (!user.telegram_chat_id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('telegram_chat_id', user.telegram_chat_id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || [])
    } catch (error: any) {
      toast.error(error.message || "فشل في تحميل الرسائل")
      console.error("Failed to load messages:", error)
    }
  }

  // اختيار مستخدم
  const handleSelectUser = (user: TelegramUser) => {
    setSelectedUser(user)
    loadUserMessages(user)
  }

  // ============= تحديث: دالة إرسال رسالة (تبقى تستدعي API Route للأمان) =============
  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim() || sending) return

    const messageContent = newMessage.trim()
    setSending(true)

    // إضافة الرسالة مؤقتاً إلى القائمة (Optimistic Update)
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: selectedUser.id,
      content: messageContent,
      role: 'admin',
      created_at: new Date().toISOString(),
      sender_name: "أنت",
      telegram_chat_id: selectedUser.telegram_chat_id
    }
    
    setMessages(prev => [...prev, tempMessage])
    setNewMessage("")

    try {
      // من الأفضل إرسال الطلب إلى API Route لأنه يحتوي على التوكن السري للبوت
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_chat_id: selectedUser.telegram_chat_id, // نرسل chat_id
          message: messageContent
        }),
      })

      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || "فشل في الإرسال")
      }
      
      toast.success("✅ تم إرسال الرسالة")
      // سيتم تحديث الرسائل عبر Real-time subscription عند إدراجها في قاعدة البيانات
      
    } catch (error: any) {
      toast.error(error.message || "خطأ في الاتصال")
      // إزالة الرسالة المؤقتة إذا فشل الإرسال
      setMessages(prev => prev.filter(m => m.id === tempMessage.id))
    } finally {
      setSending(false)
    }
  }

  // تصفية المستخدمين
  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.telegram_username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ============= تحديث: Real-time Subscription (الأهم) =============
  useEffect(() => {
    // لا نبدأ الاشتراك إلا إذا تم اختيار مستخدم ولديه chat_id
    if (!selectedUser?.telegram_chat_id) return;

    // الاستماع للرسائل الجديدة للمستخدم المحدد فقط
    const channelName = `messages:${selectedUser.telegram_chat_id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `telegram_chat_id=eq.${selectedUser.telegram_chat_id}`
        },
        (payload) => {
          console.log('New message received for user:', selectedUser.telegram_chat_id, payload.new);
          // تجنب إضافة الرسالة المؤقتة مرة أخرى
          setMessages(prev => {
            if (prev.some(msg => msg.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new as ChatMessage];
          });
        }
      )
      .subscribe();

    // دالة التنظيف عند اختيار مستخدم آخر أو مغادرة الصفحة
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser]); // يعاد تشغيله عند تغيير المستخدم المحدد

  // ============= تحديث: تحميل البيانات الأولي وإزالة Polling =============
  useEffect(() => {
    loadUsers()
  }, [])

  // ============= تم حذف useEffect الخاص بـ setInterval =============
  // لم نعد بحاجة إليه بفضل Real-time
  
  // تمرير للأسفل عند تغيير الرسائل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // الحصول على الأحرف الأولى من الاسم
  const getInitials = (name?: string) => {
    if (!name) return "??"
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // تنسيق الوقت
  const formatTime = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 60) {
      return `قبل ${diffMins} دقيقة`
    } else if (diffHours < 24) {
      return `قبل ${diffHours} ساعة`
    } else {
      return date.toLocaleDateString('ar-SA')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* الهيدر */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              دردشة Telegram
            </h1>
            <p className="text-gray-600">الرد على المستخدمين المرتبطين</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={loadUsers}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            
            <Badge variant="outline" className="px-3 py-1">
              {users.length} مستخدم
            </Badge>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex flex-1 overflow-hidden">
        {/* الشريط الجانبي - قائمة المستخدمين */}
        <div className="w-80 border-r bg-white overflow-y-auto">
          {/* البحث */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* قائمة المستخدمين */}
          <div className="p-2">
            {loading && users.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا يوجد مستخدمين مرتبطين
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors mb-1 ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">
                        {user.full_name || user.email.split('@')[0]}
                      </h4>
                      {user.unread_count && user.unread_count > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {user.unread_count > 9 ? '9+' : user.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {user.telegram_username && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          @{user.telegram_username}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500 truncate">
                        {user.last_message?.substring(0, 30)}
                        {user.last_message && user.last_message.length > 30 ? '...' : ''}
                      </p>
                    </div>
                    
                    {user.last_message_time && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(user.last_message_time)}
                      </p>
                    )}
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* منطقة الدردشة */}
        <div className="flex-1 flex flex-col">
          {/* هيدر المحادثة */}
          {selectedUser ? (
            <>
              <div className="bg-white border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {getInitials(selectedUser.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold">
                        {selectedUser.full_name || selectedUser.email.split('@')[0]}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {selectedUser.telegram_username && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            @{selectedUser.telegram_username}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedUser.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedUser.language === 'ar' ? 'default' : 'outline'}>
                      {selectedUser.language === 'ar' ? 'عربي' : 'English'}
                    </Badge>
                    
                    <Button
                      onClick={() => window.open(`/dashboard/user/${selectedUser.id}`, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      الملف الشخصي
                    </Button>
                  </div>
                </div>
              </div>

              {/* الرسائل */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">بداية محادثة جديدة</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      ابدأ المحادثة مع {selectedUser.full_name || selectedUser.email}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xl rounded-2xl p-4 ${
                          message.role === 'admin'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.role === 'admin' && (
                            <span className="text-sm font-medium text-blue-200">أنت</span>
                          )}
                          {message.role === 'user' && (
                            <span className="text-sm font-medium text-gray-600">
                              {selectedUser.full_name || selectedUser.email.split('@')[0]}
                            </span>
                          )}
                          <span className="text-xs opacity-75">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* حقل الإرسال */}
              <div className="border-t bg-white p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-[60px] resize-none"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="mr-2">إرسال</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">اختر مستخدم للدردشة</h3>
                <p className="text-gray-600 max-w-md">
                  اختر مستخدم من القائمة على اليسار لبدء المحادثة
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




