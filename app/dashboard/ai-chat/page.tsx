"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from '@/utils/supabase/browser'
import { 
  Send, 
  User, 
  Bot, 
  MessageSquare, 
  Link, 
  RefreshCw,
  Users,
  ChevronDown,
  Copy,
  Check,
  Share2,
  Mail,
  Hash,
  Trash2,
  Pin,
  ExternalLink,
  Bell,
  Search,
  Filter,
  MoreVertical,
  ThumbsUp,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"

// تعريف واجهات البيانات
interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  user_id?: string
  session_id?: string
  metadata?: {
    can_send_to_telegram?: boolean
    message_length?: number
    source?: string
    telegram_username?: string
    likes?: number
    views?: number
    pinned?: boolean
    read?: boolean
  }
  telegram_data?: any
  telegram_username?: string
}

interface UserData {
  id: string
  email: string
  full_name?: string
  telegram_chat_id?: string
  telegram_username?: string
  avatar_url?: string
  status?: "online" | "offline" | "away"
}

interface Session {
  id: string
  title: string
  last_message_at: string
  message_count?: number
  tags?: string[]
}

interface ConnectedUser {
  id: string
  email: string
  full_name?: string
  telegram_username?: string
  telegram_chat_id?: string
  language?: string
  avatar_url?: string
  last_seen?: string
  unread_messages?: number
}

interface ChannelMessage {
  id: string
  content: string
  telegram_username?: string
  created_at: string
  metadata?: {
    channel_title?: string
    source?: string
    message_id?: number
    views?: number
    likes?: number
    forwarded_from?: string
  }
  media?: {
    type: "photo" | "video" | "document" | "audio"
    url?: string
    thumbnail?: string
    file_name?: string
    file_size?: number
  }[]
}

type ActiveTab = 'personal' | 'channel'
type MessageFilter = 'all' | 'unread' | 'pinned' | 'media'



export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ConnectedUser | null>(null)
  const [showUsersDropdown, setShowUsersDropdown] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('personal')
  const [loadingChannel, setLoadingChannel] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all')
  const [showChannelInfo, setShowChannelInfo] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMediaPreview, setShowMediaPreview] = useState<{
    url: string
    type: string
    title: string
  } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const usersDropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // ============= دالة جلب بيانات المستخدم الحالي =============
  const fetchCurrentUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.error("Error fetching user:", error);
        // قم بتوجيه المستخدم لصفحة تسجيل الدخول إذا لزم الأمر
        return;
    }
    // جلب الملف الشخصي من جدول profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    setUserData(profile);
  }, []);

  // ============= دالة جلب التاريخ (محدثة لاستخدام Supabase) =============
  const loadChatHistory = useCallback(async (sessionId?: string) => {
    if (!userData) return;

    setLoading(true)
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: true });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setMessages(data || [])
      const unread = (data || []).filter(msg => msg.role === "assistant" && !msg.metadata?.read).length;
      setUnreadCount(unread);
      toast.success(`تم تحميل ${data?.length || 0} رسالة`)
    } catch (error) {
      toast.error("فشل في تحميل التاريخ")
      console.error("Error loading history:", error)
    } finally {
      setLoading(false)
    }
  }, [userData])

  // ============= دالة جلب المستخدمين المرتبطين =============
  const fetchConnectedUsers = useCallback(async () => {
    try {
      // هذه الدالة قد تحتاج لـ API Route لأنها تصل لبيانات مستخدمين آخرين
      const res = await fetch("/api/telegram/connected-users")
      const data = await res.json()
      
      if (data.success) {
        setConnectedUsers(data.users)
        if (!selectedUser && data.users.length > 0) {
          setSelectedUser(data.users[0])
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [selectedUser])
  
  // ============= دالة جلب رسائل القناة =============
  const fetchChannelMessages = useCallback(async () => {
    setLoadingChannel(true)
    try {
      // هذه الدالة قد تحتاج لـ API Route لأنها تصل لبيانات عامة
      const res = await fetch("/api/telegram/channel-messages")
      const data = await res.json()
      
      if (data.success) {
        setChannelMessages(data.messages)
      } else {
        toast.error("فشل في تحميل رسائل القناة")
      }
    } catch (error) {
      console.error("Error fetching channel messages:", error)
      toast.error("خطأ في تحميل رسائل القناة")
    } finally {
      setLoadingChannel(false)
    }
  }, [])

  // ============= دالة إرسال رسالة =============
  const sendMessage = useCallback(async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim()
    if (!messageToSend || loading || !userData) return

    if (!customMessage) {
      setInput("")
    }
    
    const tempUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageToSend,
      created_at: new Date().toISOString(),
      user_id: userData.id,
      session_id: activeSession
    }
    setMessages(prev => [...prev, tempUserMessage])

    setLoading(true)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          session_id: activeSession,
          user_id: userData.id
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success("🤖 تم إرسال الرسالة")
      } else {
        toast.error("❌ فشل في إرسال الرسالة")
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
      }
    } catch (error) {
      toast.error("🚫 خطأ في الاتصال")
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
    } finally {
      setLoading(false)
    }
  }, [input, loading, activeSession, userData])

  // ============= دالة إرسال إلى Telegram =============
  const sendToTelegram = useCallback(async (userId: string, message: string) => {
    try {
      const res = await fetch("/api/ai/chat/send-to-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId, message })
      })

      const data = await res.json()
      if (data.success) {
        toast.success("✅ تم إرسال الرسالة إلى Telegram")
      } else {
        toast.error(`❌ ${data.error || "فشل في الإرسال"}`)
      }
    } catch (error) {
      toast.error("🚫 خطأ في الاتصال")
    }
  }, [])

  // ============= دوال مساعدة =============
  const copyToClipboard = useCallback((text: string, messageId: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedMessageId(messageId)
        toast.success("📋 تم نسخ النص")
        setTimeout(() => setCopiedMessageId(null), 2000)
      })
      .catch(() => toast.error("فشل في النسخ"))
  }, [])

  const togglePinMessage = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/ai/chat/messages/${messageId}/pin`, { method: "PATCH" })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, metadata: { ...msg.metadata, pinned: !msg.metadata?.pinned } }
            : msg
        ))
        toast.success(data.message)
      }
    } catch (error) {
      toast.error("فشل في تثبيت الرسالة")
    }
  }, [])

  const likeMessage = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/ai/chat/messages/${messageId}/like`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, metadata: { ...msg.metadata, likes: (msg.metadata?.likes || 0) + 1 } }
            : msg
        ))
      }
    } catch (error) {
      console.error("Error liking message:", error)
    }
  }, [])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return
    
    try {
      const res = await fetch(`/api/ai/chat/messages/${messageId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        toast.success("تم حذف الرسالة")
      }
    } catch (error) {
      toast.error("فشل في حذف الرسالة")
    }
  }, [])

  const createNewSession = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "محادثة جديدة", tags: ["عام"] })
      })
      const data = await res.json()
      if (data.success) {
        setSessions(prev => [data.session, ...prev])
        setActiveSession(data.session.id)
        setMessages([])
        toast.success("تم إنشاء جلسة جديدة")
      }
    } catch (error) {
      toast.error("فشل في إنشاء الجلسة")
    }
  }, [])

  const formatTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch { return dateString }
  }, [])

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return "اليوم"
      if (diffDays === 1) return "أمس"
      if (diffDays < 7) return `قبل ${diffDays} أيام`
      if (diffDays < 30) return `قبل ${Math.floor(diffDays / 7)} أسبوع${Math.floor(diffDays / 7) > 1 ? 'ات' : ''}`
      return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return dateString }
  }, [])

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!selectedUser) {
      toast.error("الرجاء اختيار مستخدم أولاً")
      return
    }
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append("files", file))
    formData.append("message", "📎 ملفات مرفقة")
    formData.append("target_user_id", selectedUser.id)
    
    try {
      const res = await fetch("/api/ai/chat/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.success) {
        toast.success(`تم إرسال ${files.length} ملف`)
      }
    } catch (error) {
      toast.error("فشل في إرسال الملفات")
    }
  }, [selectedUser])
  
  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim()) return
    try {
      const res = await fetch(`/api/ai/chat/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.success) {
        if (activeTab === 'personal') setMessages(data.messages)
        else setChannelMessages(data.messages)
        toast.success(`تم العثور على ${data.messages.length} نتيجة`)
      }
    } catch (error) {
      toast.error("فشل في البحث")
    }
  }, [activeTab])

  // ============= Real-time Subscription =============
  useEffect(() => {
    if (!userData) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `user_id=eq.${userData.id}` 
        },
        (payload) => {
          console.log('New message received!', payload.new);
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              return [...prev, payload.new as Message];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userData]);

  // ============= useEffects =============
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (userData) {
      loadChatHistory();
      fetchConnectedUsers();
      fetchChannelMessages();
    }
  }, [userData, loadChatHistory, fetchConnectedUsers, fetchChannelMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, channelMessages])
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (usersDropdownRef.current && !usersDropdownRef.current.contains(event.target as Node)) {
        setShowUsersDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ============= دوال العرض (JSX) =============
  const renderPersonalMessages = () => {
    const filtered = searchQuery 
      ? messages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      : messages;

    if (filtered.length === 0 && messages.length > 0) {
      return <div className="text-center py-12"><h3>لا توجد نتائج</h3></div>
    }
    if (filtered.length === 0) {
      return <div className="text-center py-12"><h3>ابدأ محادثة جديدة</h3></div>
    }

    return filtered.map((message) => (
      <div key={message.id} className={`group flex gap-4 mb-6 ${message.role === "user" ? "justify-end" : message.role === "system" ? "justify-center" : "justify-start"}`}>
        {message.role === "assistant" && <Bot className="h-10 w-10 rounded-full bg-blue-500 text-white p-2" />}
        {message.role !== "system" && (
          <div className="relative flex-1 max-w-2xl">
            <div className={`rounded-2xl p-4 shadow-sm ${message.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 rounded-tl-none"}`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${message.role === "user" ? "text-blue-200" : "text-gray-500"}`}>{formatTime(message.created_at)}</p>
            </div>
            {/* Add controls here */}
          </div>
        )}
        {message.role === "user" && <User className="h-10 w-10 rounded-full bg-green-500 text-white p-2" />}
      </div>
    ))
  }

  const renderChannelMessages = () => {
    if (loadingChannel) return <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
    if (channelMessages.length === 0) return <div className="text-center py-12"><h3>لا توجد رسائل من القناة</h3></div>

    return channelMessages.map((message) => (
      <div key={message.id} className="bg-white border rounded-xl p-4 mb-4">
        <p className="font-semibold">قناة Icore</p>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs text-gray-500 mt-2">{formatTime(message.created_at)}</p>
      </div>
    ))
  }
  
  // ============= JSX الرئيسي =============
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">المساعد الذكي</h2>
          {userData && <p className="text-sm text-gray-600">{userData.email}</p>}
        </div>
        
        {/* User Selection */}
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">التواصل مع Telegram</h3>
          <button onClick={() => setShowUsersDropdown(!showUsersDropdown)} className="w-full p-2 border rounded flex justify-between">
            <span>{selectedUser ? selectedUser.full_name || selectedUser.email : "اختر مستخدم..."}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showUsersDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showUsersDropdown && (
            <div className="absolute z-10 w-72 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {connectedUsers.map(user => (
                <button key={user.id} onClick={() => { setSelectedUser(user); setShowUsersDropdown(false); }} className="w-full p-3 text-left hover:bg-gray-50 border-b">
                  {user.full_name || user.email}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-semibold mb-3">الجلسات</h3>
          {/* Render sessions list here */}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <h1 className="text-2xl font-bold">المساعد الذكي iCore</h1>
          <div className="flex gap-2">
            <button onClick={() => { activeTab === 'personal' ? loadChatHistory() : fetchChannelMessages() }} className="p-2 hover:bg-gray-100 rounded">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t">
          <button onClick={() => setActiveTab('personal')} className={`flex-1 p-4 text-center font-medium ${activeTab === 'personal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>محادثاتي</button>
          <button onClick={() => setActiveTab('channel')} className={`flex-1 p-4 text-center font-medium ${activeTab === 'channel' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}>قناة Icore</button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'personal' ? renderPersonalMessages() : renderChannelMessages()}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {activeTab === 'personal' && (
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="اكتب رسالتك..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? '...' : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
