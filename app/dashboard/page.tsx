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
    },
    {
      title: profile?.language === "ar" ? "العلاقات" : "Connections",
      value: connectionsCount || 0,
      icon: Users,
      description: profile?.language === "ar" ? "علاقة مهنية" : "Professional connections",
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
    },
    {
      title: profile?.language === "ar" ? "النشاط" : "Activity",
      value: "98%",
      icon: TrendingUp,
      description: profile?.language === "ar" ? "معدل النشاط" : "Activity rate",
    },
  ]

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-balance">
          {profile?.language === "ar" ? `مرحباً، ${profile?.full_name || ""}` : `Welcome, ${profile?.full_name || ""}`}
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {profile?.language === "ar" ? "هذه نظرة عامة على نشاطك" : "Here's an overview of your activity"}
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 mt-3 sm:mt-4 md:mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl">
              {profile?.language === "ar" ? "المحادثات الأخيرة" : "Recent Chats"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {profile?.language === "ar" ? "آخر محادثاتك النشطة" : "Your recent active conversations"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
              {profile?.language === "ar" ? "لا توجد محادثات بعد" : "No chats yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl">
              {profile?.language === "ar" ? "طلبات التواصل" : "Connection Requests"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {profile?.language === "ar" ? "طلبات التواصل الواردة" : "Pending connection requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
              {profile?.language === "ar" ? "لا توجد طلبات جديدة" : "No new requests"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
