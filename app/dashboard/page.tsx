import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, CreditCard, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single()
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .single()
  const { count: chatCount } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
  const { count: connectionsCount } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
    .eq("status", "accepted")

  const stats = [
    {
      title: profile?.language === "ar" ? "المحادثات" : "Chat Sessions",
      value: chatCount || 0,
      icon: MessageSquare,
      description: profile?.language === "ar" ? "محادثة نشطة" : "Active sessions",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: profile?.language === "ar" ? "العلاقات" : "Connections",
      value: connectionsCount || 0,
      icon: Users,
      description: profile?.language === "ar" ? "علاقة مهنية" : "Professional connections",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: profile?.language === "ar" ? "الاشتراك" : "Subscription",
      value: subscription
        ? profile?.language === "ar"
          ? "نشط"
          : "Active"
        : profile?.language === "ar"
          ? "غير نشط"
          : "Inactive",
      icon: CreditCard,
      description: subscription
        ? profile?.language === "ar"
          ? subscription.subscription_plans.name_ar
          : subscription.subscription_plans.name_en
        : profile?.language === "ar"
          ? "لا يوجد اشتراك"
          : "No subscription",
      color: subscription ? "text-purple-600" : "text-gray-600",
      bgColor: subscription ? "bg-purple-50" : "bg-gray-50",
    },
    {
      title: profile?.language === "ar" ? "النشاط" : "Activity",
      value: "98%",
      icon: TrendingUp,
      description: profile?.language === "ar" ? "معدل النشاط" : "Activity rate",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            {profile?.language === "ar" 
              ? `مرحباً، ${profile?.full_name || "مستخدم"}` 
              : `Welcome, ${profile?.full_name || "User"}`
            }
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            {profile?.language === "ar" ? "نظرة عامة على نشاطك" : "Here's an overview of your activity"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-gray-500">
                    {profile?.language === "ar" ? "آخر 7 أيام" : "Last 7 days"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Recent Chats Card */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                    {profile?.language === "ar" ? "المحادثات الأخيرة" : "Recent Chats"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {profile?.language === "ar" ? "آخر محادثاتك النشطة" : "Your recent active conversations"}
                  </CardDescription>
                </div>
                <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                  {profile?.language === "ar" ? "عرض الكل" : "View all"}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Placeholder for empty state */}
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {profile?.language === "ar" ? "لا توجد محادثات بعد" : "No chats yet"}
                  </p>
                  <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {profile?.language === "ar" ? "ابدأ محادثة جديدة" : "Start a new chat"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Requests Card */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                    {profile?.language === "ar" ? "طلبات التواصل" : "Connection Requests"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {profile?.language === "ar" ? "طلبات التواصل الواردة" : "Pending connection requests"}
                  </CardDescription>
                </div>
                <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                  {profile?.language === "ar" ? "عرض الكل" : "View all"}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Placeholder for empty state */}
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {profile?.language === "ar" ? "لا توجد طلبات جديدة" : "No new requests"}
                  </p>
                  <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {profile?.language === "ar" ? "ابحث عن مستخدمين" : "Find users"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section - Mobile Optimized */}
        <div className="mt-6 lg:hidden">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                {profile?.language === "ar" ? "إجراءات سريعة" : "Quick Actions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-3 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  {profile?.language === "ar" ? "محادثة جديدة" : "New Chat"}
                </button>
                <button className="p-3 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                  {profile?.language === "ar" ? "بحث مستخدمين" : "Find Users"}
                </button>
                <button className="p-3 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors">
                  {profile?.language === "ar" ? "ترقية اشتراك" : "Upgrade Plan"}
                </button>
                <button className="p-3 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors">
                  {profile?.language === "ar" ? "الإعدادات" : "Settings"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
