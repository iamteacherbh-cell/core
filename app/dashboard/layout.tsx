import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"

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
    <div className={`flex h-screen overflow-hidden bg-gray-50 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <DashboardSidebar lang={lang} />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar lang={lang}>
        <DashboardSidebar lang={lang} />
      </MobileSidebar>

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ml-4"
            onClick={() => {
              const sidebar = document.getElementById('mobile-sidebar')
              sidebar?.classList.toggle('translate-x-0')
              sidebar?.classList.toggle('-translate-x-full')
            }}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              {/* Search bar can be added here if needed */}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <UserMenu
                user={{
                  email: user.email!,
                  fullName: profile?.full_name,
                  avatarUrl: profile?.avatar_url,
                  language: lang
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
