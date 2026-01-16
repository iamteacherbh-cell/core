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

interface DashboardSidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function DashboardSidebar({ isMobile = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { language } = useLanguage()
  const t = useTranslation(language)
  const [isAdmin, setIsAdmin] = useState(false)
  const isRTL = language === "ar"

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

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
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
    <aside 
      className={cn(
        "bg-card h-screen flex flex-col",
        isMobile 
          ? "w-full max-w-xs" 
          : "w-64 border-r",
        isRTL && "rtl"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 sm:p-6 border-b">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2"
          onClick={handleLinkClick}
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
            iC
          </div>
          <span className="font-bold text-lg sm:text-xl truncate">icore.life</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <ul className="space-y-1 sm:space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isRTL && "flex-row-reverse"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}

          {isAdmin && (
            <>
              <li className="pt-4 pb-2">
                <div className={cn(
                  "px-3 text-xs font-semibold text-muted-foreground uppercase",
                  isRTL && "text-right"
                )}>
                  {language === "ar" ? "إدارة" : "Admin"}
                </div>
              </li>
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-3 sm:p-4 border-t">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3",
            isRTL && "flex-row-reverse"
          )} 
          onClick={() => {
            handleLogout()
            if (isMobile && onClose) {
              onClose()
            }
          }}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{t.logout}</span>
        </Button>
      </div>
    </aside>
  )
}
