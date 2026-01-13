import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { redirect } from "next/navigation"

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  const { data: plans } = await supabase.from("subscription_plans").select("*").eq("is_active", true)

  const isArabic = profile?.language === "ar"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{isArabic ? "إدارة الاشتراك" : "Subscription Management"}</h1>
        <p className="text-muted-foreground">
          {isArabic ? "اختر الخطة المناسبة لك" : "Choose the plan that fits your needs"}
        </p>
      </div>

      {currentSubscription && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isArabic ? "اشتراكك الحالي" : "Your Current Subscription"}</CardTitle>
                <CardDescription className="mt-2">
                  {isArabic
                    ? currentSubscription.subscription_plans.name_ar
                    : currentSubscription.subscription_plans.name_en}
                </CardDescription>
              </div>
              <Badge>{isArabic ? "نشط" : "Active"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">${currentSubscription.subscription_plans.price}</span>
              <span className="text-muted-foreground">/{isArabic ? "شهرياً" : "month"}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {isArabic ? "تنتهي في:" : "Ends on:"}{" "}
              {new Date(currentSubscription.end_date).toLocaleDateString(isArabic ? "ar-SA" : "en-US")}
            </p>
          </CardContent>
        </Card>
      )}

      <h2 className="text-2xl font-bold mb-6">{isArabic ? "الخطط المتاحة" : "Available Plans"}</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const features = isArabic ? (plan.features_ar as string[]) : (plan.features_en as string[])
          const isCurrentPlan = currentSubscription?.plan_id === plan.id

          return (
            <Card key={plan.id} className={isCurrentPlan ? "border-primary border-2" : ""}>
              <CardHeader>
                <CardTitle>{isArabic ? plan.name_ar : plan.name_en}</CardTitle>
                <CardDescription>{isArabic ? plan.description_ar : plan.description_en}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{isArabic ? "شهرياً" : "month"}</span>
                </div>
                <ul className="space-y-3">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={isCurrentPlan}>
                  {isCurrentPlan
                    ? isArabic
                      ? "الخطة الحالية"
                      : "Current Plan"
                    : isArabic
                      ? "اشترك الآن"
                      : "Subscribe Now"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
