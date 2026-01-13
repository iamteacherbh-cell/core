"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from '@/utils/supabase/browser'
import { useSupabaseUser } from '@/app/providers' // === تحديث: استيراد الـ Hook الجديد
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
  EyeOff,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

// تعريف واجهات البيانات (لم تتغير)
interface Message { /* ... */ }
interface UserData { /* ... */ }
interface Session { /* ... */ }
interface ConnectedUser { /* ... */ }
interface ChannelMessage { /* ... */ }
type ActiveTab = 'personal' | 'channel'
type MessageFilter = 'all' | 'unread' | 'pinned' | 'media'

export default function AIChatPage() {
  // === تحديث: استخدام الـ Hook الجديد للحصول على بيانات المستخدم وحالة التحميل
  const { user, loading: authLoading } = useSupabaseUser();
  
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
  const [showMediaPreview, = useState<{
    url: string
    type: string
    title: string
  } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const usersDropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // === تحديث: دالة جديدة لجلب بيانات الملف الشخصي فقط
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserData(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [user]);

  // ============= دالة جلب التاريخ (محدثة لاستخدام Supabase) =============
  const loadChatHistory = useCallback(async (sessionId?: string) => {
    if (!user) return; // === تحديث: أصبح يعتمد على `user`

    setLoading(true)
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id) // === تحديث: أصبح يعتمد على `user.id`
        .order('created_at', { ascending: true });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setMessages(data || [])
      const unread = (data || []).filter(msg => msg.role === "assistant" && !msg.metadata?.read).length;
      setUnreadCount(unread);
    } catch (error) {
      toast.error("فشل في تحميل التاريخ")
      console.error("Error loading history:", error)
    } finally {
      setLoading(false)
    }
  }, [user]); // === تحديث: أصبح يعتمد على `user`

  // ============= دالة جلب المستخدمين المرتبطين =============
  const fetchConnectedUsers = useCallback(async () => {
    try {
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

  // ============= دالة إرسال رسالة (محدثة) =============
  const sendMessage = useCallback(async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim()
    if (!messageToSend || loading || !user) return // === تحديث: أصبح يعتمد على `user`

    if (!customMessage) {
      setInput("")
    }
    
    const tempUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageToSend,
      created_at: new Date().toISOString(),
      user_id: user.id, // === تحديث: أصبح يعتمد على `user.id`
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
          user_id: user.id // === تحديث: أصبح يعتمد على `user.id`
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
  }, [input, loading, activeSession, user]); // === تحديث: أصبح يعتمد على `user`

  // ... باقي الدوال (sendToTelegram, copyToClipboard, etc.) لم تتغير
  const sendToTelegram = useCallback(async (userId: string, message: string) => { /* ... */ }, [])
  const copyToClipboard = useCallback((text: string, messageId: string) => { /* ... */ }, [])
  const togglePinMessage = useCallback(async (messageId: string) => { /* ... */ }, [])
  const likeMessage = useCallback(async (messageId: string) => { /* ... */ }, [])
  const deleteMessage = useCallback(async (messageId: string) => { /* ... */ }, [])
  const createNewSession = useCallback(async () => { /* ... */ }, [])
  const formatTime = useCallback((dateString: string) => { /* ... */ }, [])
  const formatDate = useCallback((dateString: string) => { /* ... */ }, [])
  const handleFileUpload = useCallback(async (files: FileList) => { /* ... */ }, [selectedUser])
  const searchMessages = useCallback(async (query: string) => { /* ... */ }, [activeTab])
  
  // ============= Real-time Subscription =============
  useEffect(() => {
    if (!user) return; // === تحديث: أصبح يعتمد على `user`

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `user_id=eq.${user.id}` // === تحديث: أصبح يعتمد على `user`
        },
        (payload) => {
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
  }, [user]); // === تحديث: أصبح يعتمد على `user`

  // ============= useEffects المحدثة =============
  // === تحديث: تم حذف useEffect القديم الخاص بـ fetchCurrentUser
  
  // === تحديث: هذا الـ useEffect الرئيسي يعمل فقط عندما يتغير المستخدم
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      loadChatHistory();
      fetchConnectedUsers();
      fetchChannelMessages();
    }
  }, [user]); // يعتمد فقط على `user`

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
  
  // === تحديث: عرض حالة التحميل أو عدم تسجيل الدخول
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold">غير مصرح بالوصول</h2>
          <p className="text-muted-foreground">يرجى تسجيل الدخول لمشاهدة هذه الصفحة.</p>
        </div>
      </div>
    )
  }

  // ============= دوال العرض (JSX) لم تتغير
  const renderPersonalMessages = () => { /* ... */ }
  const renderChannelMessages = () => { /* ... */ }
  
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
