"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Copy, RefreshCw } from "lucide-react"

export default function TelegramSetupPage() {
  const { language } = useLanguage()
  const t = useTranslation(language)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [webhookInfo, setWebhookInfo] = useState<any>(null)

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/telegram/webhook`
      : "https://your-app.vercel.app/api/telegram/webhook"

  const setupWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/telegram/setup", {
        method: "POST",
      })
      const data = await response.json()
      alert(data.success ? t.success : t.error)
      checkWebhook()
    } catch (error) {
      console.error("[v0] Setup webhook error:", error)
      alert(t.error)
    } finally {
      setLoading(false)
    }
  }

  const checkWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/telegram/setup")
      const data = await response.json()
      setWebhookInfo(data.info)
    } catch (error) {
      console.error("[v0] Check webhook error:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">{t.telegramSetup}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t.webhookUrl}</CardTitle>
          <CardDescription>{t.webhookInstructions}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input id="webhook-url" value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button onClick={copyWebhookUrl} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={setupWebhook} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              {t.setupWebhook}
            </Button>
            <Button onClick={checkWebhook} variant="outline" disabled={loading}>
              {t.testConnection}
            </Button>
          </div>

          {webhookInfo && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2 text-sm font-mono">
                  <div>
                    <strong>URL:</strong> {webhookInfo.result?.url || "Not set"}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {webhookInfo.result?.url ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Not configured</span>
                    )}
                  </div>
                  {webhookInfo.result?.last_error_message && (
                    <div>
                      <strong>Last Error:</strong> {webhookInfo.result.last_error_message}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription className="text-sm">
              <strong>{language === "ar" ? "ملاحظة:" : "Note:"}</strong>
              <br />
              {language === "ar"
                ? "بعد نسخ الرابط، قم بإعداد Webhook من Telegram Bot API، أو اضغط على زر 'إعداد Webhook' للإعداد التلقائي."
                : "After copying the URL, setup the Webhook from Telegram Bot API, or click 'Setup Webhook' button for automatic setup."}
              <br />
              <br />
              <strong>Bot Token:</strong>{" "}
              <code className="text-xs">8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os</code>
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
            <li>{language === "ar" ? "انسخ رابط Webhook أعلاه" : "Copy the Webhook URL above"}</li>
            <li>
              {language === "ar"
                ? "أو اضغط على زر 'إعداد Webhook' للإعداد التلقائي"
                : "Or click 'Setup Webhook' button for automatic setup"}
            </li>
            <li>
              {language === "ar" ? "اختبر البوت بإرسال رسالة إلى" : "Test the bot by sending a message to"}{" "}
              <a
                href="https://t.me/icore2_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                t.me/icore2_bot
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
