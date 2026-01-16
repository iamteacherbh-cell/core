import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

// Client component for mobile menu toggle
function MobileMenuToggle({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto h-full pb-20">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get profile data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - always visible on larger screens */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <DashboardSidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with mobile menu toggle */}
        <header className="border-b bg-white px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu toggle - client component */}
            <MobileMenuToggle>
              <DashboardSidebar />
            </MobileMenuToggle>
          </div>
          
          <UserMenu
            user={{
              email: user.email!,
              fullName: profile?.full_name,
              avatarUrl: profile?.avatar_url,
            }}
          />
        </header>
        
        {/* Main content with responsive padding */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
