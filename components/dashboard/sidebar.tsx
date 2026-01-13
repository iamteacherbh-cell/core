"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  CreditCard,
  LogOut,
  Bot,
  Mail,
  Webhook,
  MessagesSquare,
} from "lucide-react"
import { useState, useEffect } from "react"

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { language } = useLanguage()
  const t = useTranslation(language)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        setIsAdmin(profile?.role === "admin")
      }
    }
    checkAdmin()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: language === "ar" ? "لوحة التحكم" : "Dashboard",
    },
    {
      href: "/dashboard/ai-chat",
      icon: Bot,
      label: t.aiChat,
    },
    {
      href: "/dashboard/chat",
      icon: MessageSquare,
      label: language === "ar" ? "المحادثات" : "Chat",
    },
    {
      href: "/dashboard/connections",
      icon: Users,
      label: language === "ar" ? "العلاقات" : "Connections",
    },
    {
      href: "/dashboard/subscription",
      icon: CreditCard,
      label: language === "ar" ? "الاشتراك" : "Subscription",
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: language === "ar" ? "إعدادات الملف الشخصي" : "Profile Settings",
    },
  ]

  const adminNavItems = [
    {
      href: "/dashboard/admin/telegram-conversations",
      icon: MessagesSquare,
      label: t.telegramConversations,
    },
    {
      href: "/dashboard/admin/messages",
      icon: Mail,
      label: t.adminMessages,
    },
    {
      href: "/dashboard/admin/telegram-setup",
      icon: Webhook,
      label: t.telegramSetup,
    },
  ]

  return (
    <aside className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            T
          </div>
          <span className="font-bold text-xl">Tamam</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}

          {isAdmin && (
            <>
              <li className="pt-4 pb-2">
                <div className="px-3 text-xs font-semibold text-muted-foreground uppercase">
                  {language === "ar" ? "إدارة" : "Admin"}
                </div>
              </li>
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-3" />
          {t.logout}
        </Button>
      </div>
    </aside>
  )
}
