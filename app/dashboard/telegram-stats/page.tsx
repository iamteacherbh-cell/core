"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Send, 
  Inbox, 
  TrendingUp,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface StatsData {
  total_users: number
  active_users: number
  total_messages: number
  incoming_messages: number
  outgoing_messages: number
  response_time_avg: number
  today_messages: number
  week_messages: number
}

export default function TelegramStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/telegram/stats")
      const data = await res.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      toast.error("فشل في تحميل الإحصائيات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">إحصائيات Telegram</h1>
          <p className="text-gray-600">تتبع أداء التواصل مع المستخدمين</p>
        </div>
        
        <Button onClick={loadStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمين المرتبطين</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.active_users || 0} نشطون هذا الأسبوع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_messages || 0}</div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>🔽 {stats?.incoming_messages || 0}</span>
              <span>🔼 {stats?.outgoing_messages || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت الرد</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.response_time_avg ? `${stats.response_time_avg} د` : '--'}
            </div>
            <p className="text-xs text-gray-500">متوسط وقت رد المسؤول</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رسائل اليوم</CardTitle>
            <Send className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today_messages || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.week_messages || 0} رسائل هذا الأسبوع
            </p>
          </CardContent>
        </Card>
      </div>

      {/* رسومات بيانية (يمكن إضافة charts لاحقاً) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            نشاط الرسائل خلال الأسبوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            ⚡ رسومات بيانية قريباً...
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
