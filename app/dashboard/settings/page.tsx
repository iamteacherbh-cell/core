"use client"

import { useState, useEffect, FormEvent } from "react"
import { supabase } from '@/lib/supabase/client' // <--- تم تصحيح المسار هنا
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Link as LinkIcon, 
  Save, 
  Check, 
  X, 
  Loader2, 
  RefreshCw,
  MessageSquare,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"



interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  telegram_chat_id: string | null
  telegram_username: string | null
  language: string | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // حالة نموذج تحديث الملف الشخصي
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  
  // حالة ربط Telegram
  const [linkingTelegram, setLinkingTelegram] = useState(false)
  const [telegramLinkToken, setTelegramLinkToken] = useState<string | null>(null)
  const [checkingLinkStatus, setCheckingLinkStatus] = useState(false)

  // ============= جلب بيانات الملف الشخصي =============
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("المستخدم غير مسجل الدخول")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        toast.error("فشل في جلب بيانات الملف الشخصي")
        console.error(error)
      } else if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setAvatarUrl(data.avatar_url || "")
      }
      setLoading(false)
    }

    fetchProfile()
  }, [])

  // ============= الاستماع لتحديثات ربط Telegram (Real-time) =============
  useEffect(() => {
    if (!profile?.id || !checkingLinkStatus) return;

    const channel = supabase
      .channel(`profile-link-status:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          if (payload.new.telegram_chat_id && !payload.old.telegram_chat_id) {
            // تم ربط الحس بنجاح
            setProfile(prev => prev ? { ...prev, ...payload.new } as Profile : null)
            setCheckingLinkStatus(false)
            setLinkingTelegram(false)
            setTelegramLinkToken(null)
            toast.success("✅ تم ربط حساب Telegram بنجاح!")
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile?.id, checkingLinkStatus])

  // ============= دالة حفظ تغييرات الملف الشخصي =============
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl || null,
        })
        .eq('id', profile.id)

      if (error) throw error
      
      setProfile(prev => prev ? { ...prev, full_name: fullName, avatar_url } : null)
      toast.success("تم حفظ التغييرات بنجاح")
    } catch (error: any) {
      toast.error(error.message || "فشل في حفظ التغييرات")
    } finally {
      setSaving(false)
    }
  }

  // ============= دالة بدء عملية ربط Telegram =============
  const handleLinkTelegram = async () => {
    if (!profile) return

    setLinkingTelegram(true)
    try {
      // استدعاء API Route لإنشاء طلب ربط جديد
      const response = await fetch('/api/user/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل في إنشاء رابط الربط")
      }

      setTelegramLinkToken(data.token)
      setCheckingLinkStatus(true)
      toast.info("تم إنشاء رمز الربط. اتبع الخطوات التالية.")
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ ما")
      setLinkingTelegram(false)
    }
  }

  // ============= دالة فك ربط Telegram =============
  const handleUnlinkTelegram = async () => {
    if (!profile) return
    
    if (!confirm("هل أنت متأكد من فك ربط حساب Telegram؟")) return

    try {
      const response = await fetch('/api/user/unlink-telegram', {
        method: 'POST',
      })
      
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل في فك الربط")
      }

      setProfile(prev => prev ? { ...prev, telegram_chat_id: null, telegram_username: null } : null)
      toast.success("تم فك ربط حساب Telegram")
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ ما")
    }
  }

  // ============= دالة حذف الحساب =============
  const handleDeleteAccount = async () => {
    if (!profile) return

    const confirmation = prompt("لحذف حسابك نهائياً، اكتب كلمة 'حذف' للتأكيد:")
    if (confirmation !== 'حذف') return

    try {
      const response = await fetch('/api/user/account', { method: 'DELETE' })
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل في حذف الحساب")
      }

      toast.success("تم حذف حسابك بنجاح. سيتم توجيهك...")
      setTimeout(() => {
        window.location.href = '/signup'
      }, 2000)
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ ما")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return <div>لم يتم العثور على الملف الشخصي.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة حسابك وإعدادات الخصوصية.</p>
      </div>

      {/* قسم الملف الشخصي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            الملف الشخصي
          </CardTitle>
          <CardDescription>
            قم بتحديث معلوماتك الشخصية وصورتك الرمزية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="text-lg">
                  {fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar_url">رابط الصورة الرمزية (URL)</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <Input
                id="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
              />
            </div>
            
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={profile.email} disabled />
              <p className="text-sm text-muted-foreground mt-1">لا يمكن تغيير البريد الإلكتروني من هنا.</p>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              حفظ التغييرات
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* قسم ربط Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram
          </CardTitle>
          <CardDescription>
            اربط حسابك بـ Telegram لتلقي الإشعارات والرد على رسائلك مباشرة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.telegram_chat_id ? (
            // حالة: الحساب مربوط
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">الحساب مربوط</p>
                  <p className="text-sm text-green-600">
                    @{profile.telegram_username || 'بدون اسم مستخدم'}
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={handleUnlinkTelegram}>
                فك الربط
              </Button>
            </div>
          ) : (
            // حالة: الحساب غير مربوط
            <div>
              {linkingTelegram ? (
                // حالة: جاري عملية الربط
                <div className="text-center space-y-4 p-4 border rounded-lg">
                  {checkingLinkStatus ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p>في انتظار ربط الحساب...</p>
                      <p className="text-sm text-muted-foreground">
                        اذهب إلى بوت iCore في Telegram وأرسل الأمر التالي:
                      </p>
                      <code className="block p-3 bg-muted rounded-md text-sm">
                        /link {telegramLinkToken}
                      </code>
                      <Button variant="outline" size="sm" onClick={() => setCheckingLinkStatus(false)}>
                        إلغاء
                      </Button>
                    </>
                  ) : (
                    <p>جاري إنشاء رمز الربط...</p>
                  )}
                </div>
              ) : (
                // حالة: زر بدء الربط
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">لم يتم ربط حساب Telegram بعد.</p>
                  <Button onClick={handleLinkTelegram}>
                    <LinkIcon className="h-4 w-4 ml-2" />
                    ربط حساب Telegram
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* قسم حذف الحساب */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            حذف الحساب
          </CardTitle>
          <CardDescription>
            حذف حسابك سيؤدي إلى إزالة جميع بياناتك نهائياً ولا يمكن التراجع عنه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            <Trash2 className="h-4 w-4 ml-2" />
            حذف حسابي نهائياً
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
