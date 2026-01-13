"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  Copy, 
  Check, 
  User, 
  Settings, 
  Mail, 
  Shield,
  Bell,
  Link,
  Unlink,
  RefreshCw,
  ExternalLink,
  Key
} from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  telegram_chat_id?: string
  telegram_username?: string
  telegram_id?: string
  language?: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [telegramLinked, setTelegramLinked] = useState(false)
  const [telegramChatId, setTelegramChatId] = useState("")
  const [telegramUsername, setTelegramUsername] = useState("")
  const [telegramUserId, setTelegramUserId] = useState("")
  const [telegramIdInput, setTelegramIdInput] = useState("")

  // جلب بيانات المستخدم
  const loadUserProfile = async () => {
    try {
      const res = await fetch("/api/user/profile")
      const data = await res.json()
      
      if (data.success) {
        setUserProfile(data.user)
        setTelegramLinked(!!data.user.telegram_chat_id)
        setTelegramChatId(data.user.telegram_chat_id || "")
        setTelegramUsername(data.user.telegram_username || "")
        setTelegramUserId(data.user.telegram_id || "")
        
        // تعبئة حقل الإدخال إذا كان هناك معرف Telegram
        if (data.user.telegram_id) {
          setTelegramIdInput(data.user.telegram_id)
        }
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
      toast.error("فشل في تحميل بيانات المستخدم")
    }
  }

  // ربط حساب Telegram باستخدام معرف المستخدم
  const linkTelegram = async () => {
    if (!telegramIdInput.trim()) {
      toast.error("يرجى إدخال معرف Telegram الخاص بك")
      return
    }

    if (!userProfile?.id) {
      toast.error("لم يتم تحميل بيانات المستخدم")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/telegram/link-by-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userProfile.id,
          telegram_user_id: telegramIdInput.trim()
        }),
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success("✅ تم ربط حساب Telegram بنجاح!")
        setTelegramLinked(true)
        setTelegramUserId(telegramIdInput.trim())
        
        // تحديث الحالة
        setTimeout(() => {
          loadUserProfile()
        }, 1000)
      } else {
        toast.error(`❌ ${data.error || "فشل في الربط"}`)
      }
    } catch (error) {
      toast.error("خطأ في الاتصال بالخادم")
    } finally {
      setLoading(false)
    }
  }

  // إلغاء ربط Telegram
  const unlinkTelegram = async () => {
    if (!userProfile?.id) return

    if (!confirm("هل تريد إلغاء ربط حساب Telegram؟")) return

    setLoading(true)
    try {
      const res = await fetch("/api/telegram/unlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userProfile.id
        }),
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success("تم إلغاء الربط بنجاح")
        setTelegramLinked(false)
        setTelegramChatId("")
        setTelegramUsername("")
        setTelegramUserId("")
        setTelegramIdInput("")
      } else {
        toast.error("فشل في إلغاء الربط")
      }
    } catch (error) {
      toast.error("خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  // نسخ معرف Telegram
  const copyTelegramId = () => {
    if (!telegramIdInput) {
      toast.error("لا يوجد معرف لنسخه")
      return
    }
    
    navigator.clipboard.writeText(telegramIdInput).then(() => {
      toast.success("تم نسخ معرف Telegram")
    }).catch(() => {
      toast.error("فشل في نسخ النص")
    })
  }

  // تحديث الحالة
  const refreshStatus = async () => {
    await loadUserProfile()
    toast.success("تم تحديث الحالة")
  }

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    loadUserProfile()
  }, [])

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          الإعدادات
        </h1>
        <p className="text-gray-600 mt-2">إدارة حسابك وإعدادات التواصل</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* تبويبات التنقل */}
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">الملف الشخصي</span>
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Telegram</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">الإشعارات</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">الأمان</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">الحساب</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب الملف الشخصي */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                الملف الشخصي
              </CardTitle>
              <CardDescription>
                معلومات حسابك الشخصية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">الاسم الكامل</Label>
                      <Input 
                        id="full_name" 
                        defaultValue={userProfile.full_name || ""}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input 
                        id="email" 
                        defaultValue={userProfile.email}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user_id">معرف حساب iCore</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="user_id" 
                          value={userProfile.id}
                          readOnly
                          className="font-mono bg-gray-50"
                        />
                        <Button
                          onClick={() => navigator.clipboard.writeText(userProfile.id)}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        هذا المعرف فريد لحسابك في iCore
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="language">اللغة</Label>
                      <select 
                        id="language"
                        defaultValue={userProfile.language || "ar"}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button className="mt-4">
                    حفظ التغييرات
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">جاري تحميل بيانات الملف الشخصي...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب Telegram */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                ربط حساب Telegram
              </CardTitle>
              <CardDescription>
                ربط حسابك للتواصل المباشر مع iCore
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* حالة الربط */}
              <div className={`p-4 rounded-lg ${telegramLinked ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {telegramLinked ? (
                      <>
                        <Check className="h-6 w-6 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-green-800">حسابك مربوط</h3>
                          <p className="text-sm text-green-700">
                            يمكنك التواصل معنا عبر Telegram
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-6 w-6 text-yellow-600" />
                        <div>
                          <h3 className="font-semibold text-yellow-800">حسابك غير مربوط</h3>
                          <p className="text-sm text-yellow-700">
                            قم بربط حسابك للتواصل مع فريق الدعم
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Button
                    onClick={refreshStatus}
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* معلومات الربط */}
              {telegramLinked && userProfile && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>معرف Telegram</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={telegramUserId || "غير معروف"}
                          readOnly
                          className="font-mono bg-gray-50"
                        />
                        <Button
                          onClick={copyTelegramId}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>اسم المستخدم</Label>
                      <Input 
                        value={telegramUsername || "غير معروف"}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">✅ مرتبط بنجاح</h4>
                    <p className="text-sm text-blue-700">
                      يمكنك الآن إرسال رسائل إلى البوت وسيتم حفظها في حسابك.
                    </p>
                  </div>
                </div>
              )}

              {/* إدخال معرف Telegram */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="telegram_id" className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4" />
                    <span>معرف Telegram الخاص بك</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="telegram_id"
                      value={telegramIdInput}
                      onChange={(e) => setTelegramIdInput(e.target.value)}
                      placeholder="أدخل معرف Telegram الخاص بك (مثال: 1234567890)"
                      className="font-mono"
                      disabled={telegramLinked}
                    />
                    <Button
                      onClick={copyTelegramId}
                      variant="outline"
                      size="icon"
                      disabled={!telegramIdInput}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    أدخل المعرف الرقمي الذي حصلت عليه من @userinfobot
                  </p>
                </div>

                {/* إرشادات الحصول على المعرف */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3">📱 كيف أحصل على معرف Telegram؟</h4>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</span>
                      <div>
                        <p className="font-medium">افتح Telegram</p>
                        <p className="text-sm text-gray-600 mt-1">
                          افتح تطبيق Telegram على هاتفك
                        </p>
                      </div>
                    </li>
                    
                    <li className="flex items-start gap-3">
                      <span className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</span>
                      <div>
                        <p className="font-medium">ابحث عن @userinfobot</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            @userinfobot
                          </code>
                          <Button
                            onClick={() => window.open("https://t.me/userinfobot", "_blank")}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            فتح
                          </Button>
                        </div>
                      </div>
                    </li>
                    
                    <li className="flex items-start gap-3">
                      <span className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">3</span>
                      <div>
                        <p className="font-medium">انسخ المعرف الرقمي</p>
                        <p className="text-sm text-gray-600 mt-1">
                          أرسل /start للبوت ثم انسخ الرقم الذي يظهر تحت "Your ID"
                        </p>
                      </div>
                    </li>
                    
                    <li className="flex items-start gap-3">
                      <span className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">4</span>
                      <div>
                        <p className="font-medium">الصقه هنا واضغط ربط</p>
                        <p className="text-sm text-gray-600 mt-1">
                          الصق الرقم في الحقل أعلاه ثم اضغط زر "ربط حساب Telegram"
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-3 pt-4">
                {telegramLinked ? (
                  <Button
                    onClick={unlinkTelegram}
                    variant="destructive"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Unlink className="h-4 w-4" />
                    إلغاء الربط
                  </Button>
                ) : (
                  <Button
                    onClick={linkTelegram}
                    disabled={loading || !telegramIdInput.trim()}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    {loading ? "جاري المعالجة..." : "ربط حساب Telegram"}
                  </Button>
                )}
                
                <Button
                  onClick={() => window.open("https://t.me/userinfobot", "_blank")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح @userinfobot
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويبات أخرى... */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">إعدادات الإشعارات قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                الأمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">إعدادات الأمان قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الحساب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">إعدادات الحساب قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
