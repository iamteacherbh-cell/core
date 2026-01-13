"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { Send, CheckCircle2, ExternalLink, Info } from "lucide-react"

interface TelegramLinkProps {
  isLinked: boolean
  telegramUsername?: string
}

export function TelegramLink({ isLinked, telegramUsername }: TelegramLinkProps) {
  const [telegramId, setTelegramId] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { language } = useLanguage()

  const handleLink = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/telegram/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegramId,
          telegramUsername: username,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        alert(language === "ar" ? "فشل ربط الحساب" : "Failed to link account")
      }
    } catch (error) {
      console.error("Failed to link Telegram:", error)
      alert(language === "ar" ? "حدث خطأ" : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (isLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {language === "ar" ? "Telegram متصل" : "Telegram Connected"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "حسابك متصل بـ" : "Your account is connected to"} @{telegramUsername}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {language === "ar"
                  ? "يمكنك الآن إرسال واستقبال الرسائل عبر Telegram. ابدأ بإرسال رسالة إلى البوت."
                  : "You can now send and receive messages via Telegram. Start by sending a message to the bot."}
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <a href="https://t.me/icore2_bot" target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4 mr-2" />
                {language === "ar" ? "افتح البوت في Telegram" : "Open Bot in Telegram"}
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          {language === "ar"
            ? "تم ربط حساب Telegram بنجاح! جارِ إعادة التحميل..."
            : "Telegram account linked successfully! Reloading..."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          {language === "ar" ? "ربط Telegram" : "Link Telegram"}
        </CardTitle>
        <CardDescription>
          {language === "ar"
            ? "اربط حسابك على Telegram لاستقبال الإشعارات والرسائل"
            : "Link your Telegram account to receive notifications and messages"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-semibold">
              {language === "ar" ? "كيفية الحصول على معرف Telegram:" : "How to get your Telegram ID:"}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>
                {language === "ar" ? "افتح Telegram وابحث عن" : "Open Telegram and search for"}{" "}
                <code className="bg-muted px-1 rounded">@userinfobot</code>
              </li>
              <li>{language === "ar" ? "اضغط على Start أو ابدأ" : "Click Start"}</li>
              <li>
                {language === "ar"
                  ? "سيرسل لك البوت معرفك (رقم مثل 123456789)"
                  : "The bot will send you your ID (a number like 123456789)"}
              </li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="telegram-id">{language === "ar" ? "معرف Telegram" : "Telegram ID"}</Label>
          <Input
            id="telegram-id"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="123456789"
            disabled={loading}
            type="number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegram-username">
            {language === "ar" ? "اسم المستخدم (اختياري)" : "Username (optional)"}
          </Label>
          <Input
            id="telegram-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            disabled={loading}
          />
        </div>

        <Button onClick={handleLink} className="w-full" disabled={loading || !telegramId}>
          {loading
            ? language === "ar"
              ? "جارِ الربط..."
              : "Linking..."
            : language === "ar"
              ? "ربط الحساب"
              : "Link Account"}
        </Button>

        <Button asChild variant="outline" className="w-full bg-transparent">
          <a href="https://t.me/icore2_bot" target="_blank" rel="noopener noreferrer">
            {language === "ar" ? "اختبر البوت" : "Test the Bot"}
            <ExternalLink className="h-3 w-3 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
