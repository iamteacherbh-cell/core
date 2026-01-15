"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

export default function TelegramSetupPage() {
  const { language } = useLanguage()
  const t = useTranslation(language)
  const [loading, setLoading] = useState(false)

  const setupWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/telegram/setup", {
        method: "POST",
      })
      const data = await response.json()
      alert(data.success ? t.success : t.error)
    } catch (error) {
      console.error("[v0] Setup webhook error:", error)
      alert(t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">{t.telegramSetup}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "إعداد Telegram Bot" : "Telegram Bot Setup"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={setupWebhook} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              {t.setupWebhook}
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>{language === "ar" ? "ملاحظة:" : "Note:"}</strong>
              <br />
              {language === "ar"
                ? "اضغط على زر 'إعداد Webhook' للإعداد التلقائي لـ Telegram Bot."
                : "Click 'Setup Webhook' button for automatic Telegram Bot setup."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{language === "ar" ? "كيفية الإعداد" : "Setup Instructions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              {language === "ar"
                ? "اضغط على زر 'إعداد Webhook' للإعداد التلقائي"
                : "Click 'Setup Webhook' button for automatic setup"}
            </li>
            <li>
              {language === "ar" ? "اختبر البوت بإرسال رسالة إلى" : "Test the bot by sending a message to"}{" "}
              <a
                href="https://t.me/icorelife"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                t.me/icorelife
              </a>
            </li>
            <li>
              {language === "ar"
                ? "ستظهر الرسائل في صفحة 'رسائل المستخدمين'"
                : "Messages will appear in the 'User Messages' page"}
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
