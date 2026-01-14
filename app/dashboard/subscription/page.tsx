"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Check, 
  X, 
  Loader2, 
  CreditCard, 
  Crown, 
  Zap, 
  Shield,
  Calendar,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"



// تعريف الواجهات
interface SubscriptionPlan {
  id: string
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  price: number
  duration_days: number
  features_ar: string[]
  features_en: string[]
  is_active: boolean
}

interface UserSubscription {
  id: string
  status: string
  start_date: string
  end_date: string
  auto_renew: boolean
  subscription_plans: SubscriptionPlan // بيانات الخطة المرتبطة
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const supabase = createClient();
  // حالات الـ Modal للدفع
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // ============= جلب بيانات الخطط والاشتراك الحالي =============
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("المستخدم غير مسجل الدخول")
        setLoading(false)
        return
      }

      // جلب الخطط المتاحة
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (plansError) {
        toast.error("فشل في جلب خطط الاشتراك")
        console.error(plansError)
      } else {
        setPlans(plansData || [])
      }

      // جلب الاشتراك النشط للمستخدم مع تفاصيل الخطة
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (subError && subError.code !== 'PGRST116') { // PGRST116 هو خطأ "لم يتم العثور على صفوف"، وهو طبيعي إذا لم يكن هناك اشتراك
        toast.error("فشل في جلب بيانات الاشتراك")
        console.error(subError)
      } else {
        setCurrentSubscription(subData)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // ============= دالة معالجة النقر على زر الاشتراك =============
  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setIsCheckoutModalOpen(true)
  }

  // ============= دالة تأكيد عملية الدفع (وهمية) =============
  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return

    setIsProcessingPayment(true)
    
    try {
      // TODO: استبدل هذا المنطق بمنطق الدفع الحقيقي (مثل Stripe)
      // 1. إنشاء جلسة دفع في Stripe
      // 2. إعادة توجيه المستخدم إلى صفحة الدفع
      // 3. بعد نجاح الدفع، يتم تحديث قاعدة البيانات عبر Webhook من Stripe
      
      // --- منطق وهمي للمحاكاة ---
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل في إنشاء الاشتراك")
      }

      // في الوضع الحقيقي، سيتم تحديث البيانات عبر Webhook
      // هنا نقوم بتحديثها يدوياً للمحاكاة
      window.location.reload() // أسهل طريقة لتحديث البيانات بعد الاشتراك الوهمي

    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء معالجة الدفع")
    } finally {
      setIsProcessingPayment(false)
      setIsCheckoutModalOpen(false)
      setSelectedPlan(null)
    }
  }
  
  // ============= دالة إلغاء تجديد الاشتراك =============
  const handleCancelRenewal = async () => {
    if (!currentSubscription) return
    if (!confirm("هل أنت متأكد من أنك تريد إلغاء التجديد التلقائي؟")) return

    try {
      const response = await fetch('/api/subscription/cancel-renewal', {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل في إلغاء التجديد")
      }

      toast.success("تم إلغاء التجديد التلقائي بنجاح")
      setCurrentSubscription(prev => prev ? { ...prev, auto_renew: false } : null)

    } catch (error: any) {
      toast.error(error.message || "حدث خطأ")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">الاشتراكات</h1>
        <p className="text-muted-foreground">اختر الخطة التي تناسبك واحصل على أقصى استفادة من المنصة.</p>
      </div>

      {/* عرض الاشتراك الحالي */}
      {currentSubscription && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              اشتراكك الحالي
            </CardTitle>
            <CardDescription>
              أنت حالياً على خطة <strong>{currentSubscription.subscription_plans.name_ar}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الخطة</p>
                <p className="font-semibold">{currentSubscription.subscription_plans.name_ar}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                <p className="font-semibold">{formatDate(currentSubscription.end_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تجديد تلقائي</p>
                <Badge variant={currentSubscription.auto_renew ? "default" : "secondary"}>
                  {currentSubscription.auto_renew ? "مفعل" : "معطل"}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {currentSubscription.auto_renew && (
              <Button variant="outline" onClick={handleCancelRenewal}>
                إلغاء التجديد التلقائي
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      <Separator />

      {/* عرض الخطط المتاحة */}
      <div>
        <h2 className="text-2xl font-bold mb-6">اختر خطتك</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.subscription_plans.id === plan.id
            
            return (
              <Card key={plan.id} className={`flex flex-col ${isCurrentPlan ? 'border-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {plan.name_ar}
                    {isCurrentPlan && <Badge>الخطة الحالية</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description_ar}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground"> / {plan.duration_days} يوم</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features_ar.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      الخطة الحالية
                    </Button>
                  ) : (
                    <Dialog open={isCheckoutModalOpen && selectedPlan?.id === plan.id} onOpenChange={setIsCheckoutModalOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleSubscribe(plan)} className="w-full">
                          {currentSubscription ? 'ترقية' : 'اشترك الآن'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تأكيد الاشتراك</DialogTitle>
                          <DialogDescription>
                            أنت على وشك الاشتراك في خطة <strong>{selectedPlan?.name_ar}</strong>.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-2xl font-bold text-center">
                            ${selectedPlan?.price} / {selectedPlan?.duration_days} يوم
                          </p>
                          <Separator className="my-4" />
                          <ul className="space-y-2">
                            {selectedPlan?.features_ar.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCheckoutModalOpen(false)}>
                            إلغاء
                          </Button>
                          <Button onClick={handleConfirmSubscription} disabled={isProcessingPayment}>
                            {isProcessingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                            تأكيد والدفع
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
