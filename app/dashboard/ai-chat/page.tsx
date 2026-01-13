"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  metadata?: {
    can_send_to_telegram?: boolean
    message_length?: number
    source?: string
    telegram_username?: string
    likes?: number
    views?: number
    pinned?: boolean
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
  message_count: number
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

  // ============= دالة جلب التاريخ =============
  const loadChatHistory = useCallback(async (sessionId?: string) => {
    setLoading(true)
    try {
      const url = sessionId 
        ? `/api/ai/chat/history?session_id=${sessionId}`
        : "/api/ai/chat/history"
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success) {
        setUserData(data.user)
        setSessions(data.sessions)
        setActiveSession(data.active_session_id || sessionId)
        setMessages(data.messages)
        
        // حساب الرسائل غير المقروءة
        const unread = data.messages.filter((msg: Message) => 
          msg.role === "assistant" && !msg.metadata?.read
        ).length
        setUnreadCount(unread)
        
        toast.success(`تم تحميل ${data.messages.length} رسالة`)
      } else {
        toast.error("فشل في تحميل التاريخ")
      }
    } catch (error) {
      toast.error("خطأ في الاتصال")
      console.error("Error loading history:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // ============= دالة جلب المستخدمين =============
  const fetchConnectedUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/connected-users")
      const data = await res.json()
      
      if (data.success) {
        setConnectedUsers(data.users)
        
        if (!selectedUser && data.users.length > 0) {
          // اختيار المستخدم الأول كإفتراضي
          const defaultUser = data.users.find((user: ConnectedUser) => 
            user.telegram_chat_id
          ) || data.users[0]
          setSelectedUser(defaultUser)
        }
        
        // تحديث حالة الكتابة
        const typing = data.users
          .filter((user: ConnectedUser) => user.status === "typing")
          .map((user: ConnectedUser) => user.id)
        setTypingUsers(typing)
        
        toast.success(`تم تحديث ${data.users.length} مستخدم`)
      } else {
        toast.error("فشل في تحميل المستخدمين")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [selectedUser])

  // ============= دالة جلب رسائل القناة =============
  const fetchChannelMessages = useCallback(async () => {
    setLoadingChannel(true)
    try {
      const res = await fetch("/api/telegram/channel-messages")
      const data = await res.json()
      
      if (data.success) {
        setChannelMessages(data.messages)
        toast.success(`تم تحميل ${data.messages.length} رسالة من القناة`)
      } else {
        // المحاولة 2: جلب من جدول channel_messages مباشرة
        const backupRes = await fetch("/api/telegram/channel-messages-backup")
        const backupData = await backupRes.json()
        
        if (backupData.success) {
          setChannelMessages(backupData.messages)
          toast.info("يتم عرض رسائل القناة من النسخة الاحتياطية")
        } else {
          toast.error("فشل في تحميل رسائل القناة")
        }
      }
    } catch (error) {
      console.error("Error fetching channel messages:", error)
      toast.error("خطأ في تحميل رسائل القناة")
    } finally {
      setLoadingChannel(false)
    }
  }, [])

  // ============= دالة إرسال إلى Telegram =============
  const sendToTelegram = useCallback(async (
    userId: string, 
    message: string, 
    action = 'forward',
    options?: {
      media?: File[]
      reply_to_message_id?: number
      silent?: boolean
    }
  ) => {
    try {
      const formData = new FormData()
      formData.append("message", message)
      formData.append("target_user_id", userId)
      formData.append("action", action)
      formData.append("ai_context", "مساعدة من المساعد الذكي iCore")
      
      if (options?.reply_to_message_id) {
        formData.append("reply_to_message_id", options.reply_to_message_id.toString())
      }
      
      if (options?.silent) {
        formData.append("silent", "true")
      }
      
      if (options?.media && options.media.length > 0) {
        options.media.forEach(file => {
          formData.append("media", file)
        })
      }

      const res = await fetch("/api/ai/chat/send", {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      
      if (data.success) {
        if (data.telegram_sent) {
          toast.success("✅ تم إرسال الرسالة إلى Telegram")
          
          setMessages(prev => [...prev, {
            id: `tg-${Date.now()}`,
            role: "system",
            content: `📨 أرسلت رسالة إلى Telegram:\nالمستخدم: ${data.user_info?.name || "مجهول"}\nالرسالة: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`,
            created_at: new Date().toISOString(),
            telegram_data: data,
            metadata: {
              telegram_message_id: data.message_id
            }
          }])
          
          return true
        } else {
          toast.warning("⚠️ المستخدم غير مربوط بـ Telegram")
          return false
        }
      } else {
        toast.error(`❌ ${data.error || "فشل في إرسال الرسالة"}`)
        return false
      }
    } catch (error) {
      toast.error("🚫 خطأ في الاتصال")
      return false
    }
  }, [])

  // ============= دالة إرسال رسالة AI =============
  const sendMessage = useCallback(async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim()
    if (!messageToSend || loading) return

    if (!customMessage) {
      setInput("")
    }
    
    const tempUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageToSend,
      created_at: new Date().toISOString(),
      metadata: {
        message_length: messageToSend.length
      }
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
          context: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await res.json()
      
      if (data.success) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.response,
          created_at: new Date().toISOString(),
          metadata: {
            can_send_to_telegram: true,
            message_length: data.response.length,
            likes: 0,
            views: 0
          }
        }
        setMessages(prev => [...prev, aiMessage])
        
        toast.success("🤖 تم إنشاء الرد")
        
        if (selectedUser && data.response.length < 1000) {
          setTimeout(() => {
            toast.info("💡 يمكنك إرسال هذا الرد إلى Telegram", { 
              duration: 5000,
              action: {
                label: "إرسال الآن",
                onClick: () => sendToTelegram(selectedUser.id, data.response, 'forward')
              }
            })
          }, 1000)
        }
      } else {
        toast.error("❌ فشل في إنشاء الرد")
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
      }
    } catch (error) {
      toast.error("🚫 خطأ في الاتصال")
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
    } finally {
      setLoading(false)
    }
  }, [input, loading, activeSession, messages, selectedUser, sendToTelegram])

  // ============= دالة نسخ النص =============
  const copyToClipboard = useCallback((text: string, messageId: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedMessageId(messageId)
        toast.success("📋 تم نسخ النص")
        setTimeout(() => setCopiedMessageId(null), 2000)
      })
      .catch(() => {
        toast.error("فشل في النسخ")
      })
  }, [])

  // ============= دالة تثبيت رسالة =============
  const togglePinMessage = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/ai/chat/messages/${messageId}/pin`, {
        method: "PATCH"
      })
      
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

  // ============= دالة تسجيل إعجاب =============
  const likeMessage = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/ai/chat/messages/${messageId}/like`, {
        method: "POST"
      })
      
      const data = await res.json()
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                metadata: { 
                  ...msg.metadata, 
                  likes: (msg.metadata?.likes || 0) + 1 
                } 
              }
            : msg
        ))
      }
    } catch (error) {
      console.error("Error liking message:", error)
    }
  }, [])

  // ============= دالة حذف رسالة =============
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return
    
    try {
      const res = await fetch(`/api/ai/chat/messages/${messageId}`, {
        method: "DELETE"
      })
      
      const data = await res.json()
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        toast.success("تم حذف الرسالة")
      }
    } catch (error) {
      toast.error("فشل في حذف الرسالة")
    }
  }, [])

  // ============= دالة إنشاء جلسة جديدة =============
  const createNewSession = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "محادثة جديدة",
          tags: ["عام"]
        })
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

  // ============= دالة تنسيق الوقت =============
  const formatTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateString
    }
  }, [])

  // ============= دالة تنسيق التاريخ =============
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return "اليوم"
      } else if (diffDays === 1) {
        return "أمس"
      } else if (diffDays < 7) {
        return `قبل ${diffDays} أيام`
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return `قبل ${weeks} أسبوع${weeks > 1 ? 'ات' : ''}`
      } else {
        return date.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    } catch {
      return dateString
    }
  }, [])

  // ============= دالة تحميل ملف =============
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!selectedUser) {
      toast.error("الرجاء اختيار مستخدم أولاً")
      return
    }

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append("files", file)
    })
    
    formData.append("message", "📎 ملفات مرفقة")
    formData.append("target_user_id", selectedUser.id)
    
    try {
      const res = await fetch("/api/ai/chat/upload", {
        method: "POST",
        body: formData
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success(`تم إرسال ${files.length} ملف`)
      }
    } catch (error) {
      toast.error("فشل في إرسال الملفات")
    }
  }, [selectedUser])

  // ============= دالة البحث =============
  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim()) return
    
    try {
      const res = await fetch(`/api/ai/chat/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      
      if (data.success) {
        if (activeTab === 'personal') {
          setMessages(data.messages)
        } else {
          setChannelMessages(data.messages)
        }
        toast.success(`تم العثور على ${data.messages.length} نتيجة`)
      }
    } catch (error) {
      toast.error("فشل في البحث")
    }
  }, [activeTab])

  // ============= useEffect للتحميل الأولي =============
  useEffect(() => {
    loadChatHistory()
    fetchConnectedUsers()
    fetchChannelMessages()
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => {
      fetchConnectedUsers()
      if (activeTab === 'channel') {
        fetchChannelMessages()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [loadChatHistory, fetchConnectedUsers, fetchChannelMessages, activeTab])

  // ============= useEffect للتمرير للأسفل =============
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, channelMessages, activeTab])

  // ============= إغلاق dropdown عند النقر خارج =============
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (usersDropdownRef.current && !usersDropdownRef.current.contains(event.target as Node)) {
        setShowUsersDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ============= تحميل المزيد من الرسائل عند التمرير =============
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    if (container.scrollTop === 0 && !loading) {
      // تحميل المزيد من الرسائل
      console.log("تحميل المزيد...")
    }
  }, [loading])

  // ============= عرض الرسائل بناءً على التبويب النشط =============
  const renderMessages = () => {
    if (activeTab === 'channel') {
      return renderChannelMessages()
    } else {
      return renderPersonalMessages()
    }
  }

  // ============= تصفية الرسائل =============
  const filteredMessages = useCallback(() => {
    let filtered = messages
    
    if (searchQuery) {
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (messageFilter === 'pinned') {
      filtered = filtered.filter(msg => msg.metadata?.pinned)
    } else if (messageFilter === 'unread') {
      filtered = filtered.filter(msg => 
        msg.role === "assistant" && !msg.metadata?.read
      )
    }
    
    return filtered
  }, [messages, searchQuery, messageFilter])

  // ============= عرض رسائل القناة =============
  const renderChannelMessages = () => {
    if (loadingChannel) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="mr-2">جاري تحميل رسائل القناة...</span>
        </div>
      )
    }

    if (channelMessages.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="h-16 w-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Hash className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">لا توجد رسائل من القناة</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            لم تصل أي رسائل من قناة Icore بعد. تأكد من أن الـ Webhook يعمل بشكل صحيح.
          </p>
          <button
            onClick={fetchChannelMessages}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث القناة
          </button>
        </div>
      )
    }

    const filteredChannelMessages = searchQuery 
      ? channelMessages.filter(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.telegram_username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : channelMessages

    return (
      <div className="space-y-4">
        {filteredChannelMessages.map((message) => (
          <div 
            key={message.id} 
            className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                    قناة Icore
                  </span>
                  {message.telegram_username && (
                    <span className="text-xs text-gray-600">@{message.telegram_username}</span>
                  )}
                  {message.metadata?.forwarded_from && (
                    <span className="text-xs text-gray-500">
                      ↪️ من: {message.metadata.forwarded_from}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mr-auto text-xs text-gray-500">
                    {message.metadata?.views && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {message.metadata.views}
                      </span>
                    )}
                    {message.metadata?.likes && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {message.metadata.likes}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                {message.metadata?.channel_title && (
                  <p className="text-xs text-gray-500 mt-1">{message.metadata.channel_title}</p>
                )}
              </div>
            </div>
            
            <p className="whitespace-pre-wrap text-gray-800 mb-3">{message.content}</p>
            
            {/* عرض الوسائط المرفقة */}
            {message.media && message.media.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {message.media.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.type === 'photo' && media.thumbnail && (
                      <img 
                        src={media.thumbnail} 
                        alt="صورة"
                        className="w-full h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => setShowMediaPreview({
                          url: media.url || media.thumbnail || '',
                          type: media.type,
                          title: media.file_name || 'صورة من القناة'
                        })}
                      />
                    )}
                    {media.type === 'document' && (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                            <ExternalLink className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{media.file_name}</p>
                            {media.file_size && (
                              <p className="text-xs text-gray-500">
                                {(media.file_size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className="text-xs text-gray-500">
                {formatDate(message.created_at)}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  {copiedMessageId === message.id ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>نسخ</span>
                    </>
                  )}
                </button>
                
                {message.metadata?.message_id && (
                  <a
                    href={`https://t.me/icorechannel/${message.metadata.message_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>فتح في Telegram</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ============= عرض الرسائل الشخصية =============
  const renderPersonalMessages = () => {
    const filtered = filteredMessages()
    
    if (filtered.length === 0 && messages.length > 0) {
      return (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
          <p className="text-gray-600">لم يتم العثور على رسائل تطابق بحثك.</p>
          <button
            onClick={() => {
              setSearchQuery("")
              setMessageFilter('all')
            }}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
          >
            عرض كل الرسائل
          </button>
        </div>
      )
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="h-16 w-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">بداية محادثة جديدة</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            ابدأ محادثة مع المساعد الذكي لـ iCore. يمكنك السؤال عن بناء الشبكات المهنية، تحسين الملف الشخصي، أو أي استفسار آخر.
          </p>
          
          {selectedUser ? (
            <div className="space-y-3">
              <button
                onClick={async () => {
                  const message = prompt(`أدخل رسالة ترحيبية إلى ${selectedUser.full_name || selectedUser.email}:`)
                  if (message && message.trim()) {
                    await sendToTelegram(selectedUser.id, message.trim(), 'direct')
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
              >
                <Share2 className="h-4 w-4" />
                إرسال رسالة ترحيبية إلى {selectedUser.full_name?.split(' ')[0]}
              </button>
              
              <button
                onClick={() => {
                  setInput("مرحباً! كيف يمكنني مساعدتك اليوم؟")
                  inputRef.current?.focus()
                }}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 flex items-center gap-2 mx-auto"
              >
                <Bot className="h-4 w-4" />
                بدء محادثة مع المساعد الذكي
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowUsersDropdown(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Users className="h-4 w-4" />
              اختر مستخدماً للبدء
            </button>
          )}
        </div>
      )
    }

    return (
      <>
        {typingUsers.length > 0 && selectedUser && typingUsers.includes(selectedUser.id) && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-600">يكتب...</span>
              </div>
            </div>
          </div>
        )}

        {filtered.map((message) => (
          <div
            key={message.id}
            className={`group flex gap-4 mb-6 ${
              message.role === "user" ? "justify-end" : 
              message.role === "system" ? "justify-center" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
            
            {message.role === "system" && (
              <div className="w-full max-w-2xl">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Share2 className="h-3 w-3 text-yellow-600" />
                    </div>
                    <span className="font-medium text-yellow-800">إشعار نظام</span>
                  </div>
                  <p className="text-yellow-700 whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-yellow-600 mt-2">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            )}
            
            {message.role !== "system" && (
              <div className="relative flex-1 max-w-2xl">
                <div
                  className={`rounded-2xl p-4 shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-none"
                      : "bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-tl-none"
                  }`}
                >
                  {/* تثبيت الرسالة */}
                  {message.metadata?.pinned && (
                    <div className="flex items-center gap-1 mb-2 text-xs">
                      <Pin className="h-3 w-3" />
                      <span className={message.role === "user" ? "text-blue-200" : "text-gray-500"}>
                        مثبتة
                      </span>
                    </div>
                  )}
                  
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-opacity-20">
                    <div className="flex items-center gap-3">
                      <p className={`text-xs ${
                        message.role === "user" ? "text-blue-200" : "text-gray-500"
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                      
                      {/* إحصائيات الرسالة */}
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => likeMessage(message.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>{message.metadata?.likes || 0}</span>
                          </button>
                          
                          {message.metadata?.views && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Eye className="h-3 w-3" />
                              <span>{message.metadata.views}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {message.metadata?.message_length && (
                      <span className={`text-xs ${
                        message.role === "user" ? "text-blue-200" : "text-gray-500"
                      }`}>
                        {message.metadata.message_length} حرف
                      </span>
                    )}
                  </div>
                </div>
                
                {/* أزرار التحكم للرسالة */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg border shadow-sm p-1">
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="h-8 w-8 rounded flex items-center justify-center hover:bg-gray-100"
                    title="نسخ النص"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  
                  {message.role === "assistant" && selectedUser && (
                    <button
                      onClick={() => sendToTelegram(selectedUser.id, message.content, 'forward')}
                      className="h-8 w-8 rounded flex items-center justify-center hover:bg-green-50"
                      title="إرسال إلى Telegram"
                    >
                      <Share2 className="h-4 w-4 text-green-600" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => togglePinMessage(message.id)}
                    className="h-8 w-8 rounded flex items-center justify-center hover:bg-yellow-50"
                    title={message.metadata?.pinned ? "إلغاء التثبيت" : "تثبيت الرسالة"}
                  >
                    <Pin className={`h-4 w-4 ${message.metadata?.pinned ? 'text-yellow-600 fill-yellow-600' : 'text-gray-600'}`} />
                  </button>
                  
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="h-8 w-8 rounded flex items-center justify-center hover:bg-red-50"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            )}
            
            {message.role === "user" && (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        ))}
      </>
    )
  }

  // ============= معاينة الوسائط =============
  const MediaPreviewModal = () => {
    if (!showMediaPreview) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">{showMediaPreview.title}</h3>
            <button
              onClick={() => setShowMediaPreview(null)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-auto">
            {showMediaPreview.type === 'photo' ? (
              <img 
                src={showMediaPreview.url} 
                alt="معاينة"
                className="max-w-full h-auto rounded"
              />
            ) : (
              <div className="text-center py-12">
                <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">يمكنك فتح هذا الملف في نافذة جديدة</p>
                <a
                  href={showMediaPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  فتح الملف
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* الشريط الجانبي */}
      <div className="w-80 border-r bg-white overflow-y-auto flex flex-col shadow-lg">
        <div className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            المساعد الذكي
          </h2>
          
          {userData && (
            <div className="mt-4 p-4 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center">
                  {userData.avatar_url ? (
                    <img 
                      src={userData.avatar_url} 
                      alt={userData.full_name || userData.email}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <User className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{userData.full_name || userData.email}</p>
                  <p className="text-sm text-blue-100 truncate">{userData.email}</p>
                </div>
                <div className="relative">
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
              
              {userData.telegram_chat_id ? (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span>مرتبط مع Telegram</span>
                </div>
              ) : (
                <div className="mt-3">
                  <a 
                    href="/dashboard/settings/telegram" 
                    className="text-sm bg-white bg-opacity-30 hover:bg-opacity-40 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                  >
                    <Link className="h-4 w-4" />
                    ربط حساب Telegram
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* قسم التواصل مع Telegram */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="relative" ref={usersDropdownRef}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                التواصل مع Telegram
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={fetchConnectedUsers}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="تحديث القائمة"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowChannelInfo(!showChannelInfo)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="معلومات القناة"
                >
                  <Hash className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* اختيار المستخدم */}
            <button
              onClick={() => setShowUsersDropdown(!showUsersDropdown)}
              className="w-full p-3 bg-gray-50 border rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {selectedUser ? (
                  <>
                    <div className="relative">
                      <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white">
                        {selectedUser.avatar_url ? (
                          <img 
                            src={selectedUser.avatar_url} 
                            alt={selectedUser.full_name || selectedUser.email}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      {selectedUser.status === 'online' && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {selectedUser.full_name || selectedUser.email.split('@')[0]}
                        </p>
                        {selectedUser.unread_messages && selectedUser.unread_messages > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {selectedUser.unread_messages}
                          </span>
                        )}
                      </div>
                      {selectedUser.telegram_username ? (
                        <p className="text-xs text-gray-500 truncate">
                          @{selectedUser.telegram_username}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 truncate">
                          {selectedUser.last_seen ? `آخر ظهور: ${formatDate(selectedUser.last_seen)}` : ''}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">اختر مستخدم...</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showUsersDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown للمستخدمين */}
            {showUsersDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {connectedUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>لا يوجد مستخدمين مرتبطين</p>
                  </div>
                ) : (
                  connectedUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user)
                        setShowUsersDropdown(false)
                        toast.success(`✅ تم اختيار ${user.full_name || user.email}`)
                      }}
                      className={`w-full p-3 text-left flex items-center gap-3 hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedUser?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.full_name || user.email}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        {user.status === 'online' && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {user.full_name || user.email.split('@')[0]}
                          </p>
                          {user.unread_messages && user.unread_messages > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {user.unread_messages}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {user.telegram_username ? `@${user.telegram_username}` : user.email}
                        </p>
                        {user.language && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            {user.language}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* معلومات القناة */}
          {showChannelInfo && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-800">قناة Icore</h4>
              </div>
              <p className="text-xs text-purple-700 mb-2">
                آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
              </p>
              <p className="text-xs text-purple-600">
                {channelMessages.length} رسالة متاحة
              </p>
            </div>
          )}

          {/* أزرار التحكم */}
          {selectedUser && (
            <div className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  const message = prompt(`أدخل رسالة لإرسالها إلى ${selectedUser.full_name || selectedUser.email}:`)
                  if (message && message.trim()) {
                    await sendToTelegram(selectedUser.id, message.trim(), 'direct')
                  }
                }}
                className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 flex items-center justify-center gap-2 shadow-sm"
              >
                <Share2 className="h-4 w-4" />
                إرسال رسالة مباشرة
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  ملفات
                </button>
                
                <button
                  onClick={async () => {
                    const lastAiMessage = messages
                      .filter(m => m.role === "assistant")
                      .pop()

                    if (!lastAiMessage) {
                      toast.warning("⚠️ لا يوجد رد من AI لإرساله")
                      return
                    }

                    await sendToTelegram(selectedUser.id, lastAiMessage.content, 'ai_forward')
                  }}
                  disabled={!messages.some(m => m.role === 'assistant')}
                  className="p-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Bot className="h-4 w-4" />
                  إرسال آخر رد
                </button>
              </div>
            </div>
          )}
        </div>

        {/* قائمة الجلسات */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">الجلسات السابقة</h3>
            <button
              onClick={createNewSession}
              className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-200"
            >
              + جديد
            </button>
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد جلسات سابقة</p>
              <button
                onClick={createNewSession}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                إنشاء جلسة جديدة
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadChatHistory(session.id)}
                  className={`w-full p-3 text-left rounded-lg border transition-all hover:shadow-sm ${
                    activeSession === session.id 
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm" 
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{session.title || "محادثة بدون عنوان"}</p>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {session.message_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {formatDate(session.last_message_at)}
                    </p>
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex gap-1">
                        {session.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* إحصائيات */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white rounded-lg">
              <p className="text-sm font-semibold">{messages.length}</p>
              <p className="text-xs text-gray-500">رسائل</p>
            </div>
            <div className="p-2 bg-white rounded-lg">
              <p className="text-sm font-semibold">{connectedUsers.length}</p>
              <p className="text-xs text-gray-500">مستخدمين</p>
            </div>
            <div className="p-2 bg-white rounded-lg">
              <p className="text-sm font-semibold">{sessions.length}</p>
              <p className="text-xs text-gray-500">جلسات</p>
            </div>
          </div>
        </div>
      </div>

      {/* منطقة الدردشة الرئيسية */}
      <div className="flex-1 flex flex-col">
        {/* الهيدر مع التبويبات */}
        <div className="border-b bg-white flex-shrink-0 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <Bot className="h-6 w-6" />
                  المساعد الذكي iCore
                </h1>
                <p className="text-gray-600">اسألني عن بناء الشبكات المهنية والتواصل</p>
              </div>
              
              <div className="flex items-center gap-4">
                {selectedUser && activeTab === 'personal' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200 flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedUser.full_name?.split(' ')[0] || selectedUser.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedUser.telegram_username ? `@${selectedUser.telegram_username}` : selectedUser.email}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeTab === 'personal') {
                        loadChatHistory()
                      } else {
                        fetchChannelMessages()
                      }
                    }}
                    disabled={activeTab === 'personal' ? loading : loadingChannel}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="تحديث المحادثة"
                  >
                    <RefreshCw className={`h-5 w-5 ${(activeTab === 'personal' ? loading : loadingChannel) ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        if (e.target.value.trim()) {
                          searchMessages(e.target.value)
                        }
                      }}
                      className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* التبويبات والفلاتر */}
          <div className="px-6">
            <div className="flex border-t">
              <button
                onClick={() => {
                  setActiveTab('personal')
                  setSearchQuery("")
                  setMessageFilter('all')
                }}
                className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                  activeTab === 'personal' 
                    ? "text-blue-600" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  محادثاتي
                  {messages.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {messages.length}
                    </span>
                  )}
                </div>
                {activeTab === 'personal' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('channel')
                  setSearchQuery("")
                }}
                className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                  activeTab === 'channel' 
                    ? "text-purple-600" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Hash className="h-4 w-4" />
                  قناة Icore
                  {channelMessages.length > 0 && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                      {channelMessages.length}
                    </span>
                  )}
                </div>
                {activeTab === 'channel' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500"></div>
                )}
              </button>
            </div>
            
            {/* فلاتر الرسائل */}
            {activeTab === 'personal' && (
              <div className="flex gap-2 py-3 border-t">
                <button
                  onClick={() => setMessageFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    messageFilter === 'all' 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setMessageFilter('unread')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    messageFilter === 'unread' 
                      ? "bg-red-100 text-red-800" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  غير مقروء
                  {unreadCount > 0 && (
                    <span className="mr-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMessageFilter('pinned')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    messageFilter === 'pinned' 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Pin className="h-3 w-3 inline ml-1" />
                  المثبتة
                </button>
              </div>
            )}
          </div>
        </div>

        {/* الرسائل */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-gray-50"
        >
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        {/* حقل الإدخال (يظهر فقط في تبويب المحادثات الشخصية) */}
        {activeTab === 'personal' && (
          <div className="p-6 border-t bg-white flex-shrink-0 shadow-lg">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
                  className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 pl-12"
                  disabled={loading}
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-500 hover:text-gray-700"
                    title="إرفاق ملف"
                  >
                    <Link className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="px-8 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm hover:shadow"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    إرسال
                  </>
                )}
              </button>
            </div>
            
            {/* أزرار سريعة */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => setInput("كيف يمكنني بناء شبكة علاقات قوية في iCore؟")}
                className="px-3 py-2 text-sm bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-all border border-blue-100"
              >
                بناء شبكة علاقات
              </button>
              <button
                onClick={() => setInput("كيف أحسن ملفي الشخصي على iCore؟")}
                className="px-3 py-2 text-sm bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all border border-green-100"
              >
                تحسين الملف الشخصي
              </button>
              <button
                onClick={() => setInput("ما هي مزايا ربط حسابي مع Telegram؟")}
                className="px-3 py-2 text-sm bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-100"
              >
                مزايا Telegram
              </button>
              
              {selectedUser && (
                <>
                  <button
                    onClick={() => {
                      setInput(`أكتب رسالة ترحيبية للمستخدم ${selectedUser.full_name?.split(' ')[0] || selectedUser.email.split('@')[0]}`)
                    }}
                    className="px-3 py-2 text-sm bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 rounded-lg hover:from-orange-100 hover:to-amber-100 transition-all border border-orange-100"
                  >
                    رسالة ترحيب
                  </button>
                  <button
                    onClick={() => sendMessage("ما هي آخر نشاطات المستخدم على المنصة؟")}
                    className="px-3 py-2 text-sm bg-gradient-to-r from-gray-50 to-slate-50 text-gray-800 rounded-lg hover:from-gray-100 hover:to-slate-100 transition-all border border-gray-100"
                  >
                    استعلام عن نشاطات
                  </button>
                </>
              )}
            </div>
            
            {/* إحصائيات */}
            <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="font-medium">{messages.length}</span> رسالة
                </div>
                {selectedUser && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>مستخدم مختار: <span className="font-medium">{selectedUser.full_name?.split(' ')[0]}</span></span>
                    {selectedUser.unread_messages && selectedUser.unread_messages > 0 && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                        {selectedUser.unread_messages} رسالة جديدة
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {connectedUsers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{connectedUsers.length} مستخدم مرتبط</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  <span>التحديث التلقائي نشط</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* معلومات القناة (يظهر فقط في تبويب القناة) */}
        {activeTab === 'channel' && (
          <div className="p-6 border-t bg-white flex-shrink-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Hash className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">قناة Icore الرسمية</h3>
                  <p className="text-sm text-gray-600">أحدث الرسائل من القناة</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-purple-700">{channelMessages.length}</p>
                    <p className="text-gray-500">رسالة</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-purple-700">
                      {channelMessages.filter(msg => msg.metadata?.views).reduce((sum, msg) => sum + (msg.metadata?.views || 0), 0)}
                    </p>
                    <p className="text-gray-500">مشاهدة</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const url = prompt("أدخل رابط القناة:", "https://t.me/icorechannel")
                    if (url) {
                      window.open(url, '_blank')
                    }
                  }}
                  className="px-4 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  زيارة القناة
                </button>
                <button
                  onClick={fetchChannelMessages}
                  disabled={loadingChannel}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 flex items-center gap-2 transition-all shadow-sm hover:shadow disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingChannel ? 'animate-spin' : ''}`} />
                  {loadingChannel ? "جاري التحديث..." : "تحديث القناة"}
                </button>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
              <div>
                <p>الرسائل تصل تلقائياً من قناة Icore على Telegram.</p>
                <p className="text-xs text-gray-500 mt-1">
                  آخر تحديث: {new Date().toLocaleTimeString('ar-SA')} | 
                  التحديث التالي: خلال 30 ثانية
                </p>
              </div>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'قناة Icore',
                      text: 'تابع قناة Icore على Telegram',
                      url: 'https://t.me/icorechannel'
                    })
                  }
                }}
                className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                مشاركة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* معاينة الوسائط */}
      <MediaPreviewModal />

      {/* ملفات مخفية */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  )
}
