import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileSidebarProvider } from "@/components/providers/mobile-sidebar-provider"
import { MobileSidebarToggle } from "@/components/ui/mobile-sidebar-toggle"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get profile data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Determine language direction
  const isRTL = profile?.language === "ar"
  const lang = profile?.language || "en"

  return (
    <MobileSidebarProvider>
      <div className={`flex h-screen overflow-hidden bg-gray-50 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <DashboardSidebar lang={lang} />
          </div>
        </aside>

        {/* Mobile Sidebar - rendered inside provider */}
        <div id="mobile-sidebar-container" />

        {/* Main Content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Top Header */}
          <DashboardHeader 
            user={{
              email: user.email!,
              fullName: profile?.full_name,
              avatarUrl: profile?.avatar_url,
              language: lang
            }}
          />

          {/* Main Content Area */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-4 sm:py-6">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  )
}
