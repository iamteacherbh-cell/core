"use client"

import { useState, useEffect } from "react"
import { Copy, Check, RefreshCw, MessageSquare, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export default function TelegramSettings() {
  const [linkData, setLinkData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  const generateLink = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/telegram/generate-link")
      const data = await res.json()
      
      if (data.success) {
        setLinkData(data)
        toast.success("تم إنشاء رابط الربط")
      } else {
        toast.error("فشل في إنشاء الرابط")
      }
    } catch (error) {
      toast.error("خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    generateLink()
  }, [])
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          ربط حساب Telegram
        </h1>
        <p className="text-gray-600 mt-2">
          ربط حسابك للتواصل المباشر مع iCore
        </p>
      </div>
      
      {linkData ? (
        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold mb-4 text-center">QR Code للربط السريع</h3>
            <div className="flex justify-center">
              <img 
                src={linkData.qr_code_url} 
                alt="QR Code" 
                className="border-2 border-gray-200 rounded-lg"
              />
            </div>
            <p className="text-sm text-center text-gray-500 mt-3">
              امسح الكود باستخدام كاميرا هاتفك
            </p>
          </div>
          
          {/* الرابط */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold mb-3">الرابط المباشر</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={linkData.telegram_link}
                readOnly
                className="flex-1 p-3 border rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(linkData.telegram_link)
                  setCopied(true)
                  toast.success("تم نسخ الرابط")
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "تم النسخ" : "نسخ"}
              </button>
              <a
                href={linkData.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                فتح
              </a>
            </div>
          </div>
          
          {/* التعليمات */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-800 mb-3">📱 خطوات الربط</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>افتح الرابط على هاتفك المثبت عليه Telegram</li>
              <li>اضغط على زر "Start" في البوت</li>
              <li>سيتم ربط حسابك تلقائياً</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⏰ الرابط صالح لمدة 30 دقيقة فقط
              </p>
            </div>
          </div>
          
          {/* زر التجديد */}
          <div className="text-center">
            <button
              onClick={generateLink}
              disabled={loading}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "جاري الإنشاء..." : "إنشاء رابط جديد"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded-xl mx-auto max-w-sm"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
          <button
            onClick={generateLink}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إنشاء رابط
          </button>
        </div>
      )}
    </div>
  )
}
