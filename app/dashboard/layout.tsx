"use client"

import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { createClient } from "@/lib/supabase/client"
import { redirect, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }
      
      setUser(user)
      
      // Get profile data
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(profile)
      setLoading(false)
    }
    
    checkAuth()
  }, [router])
  
  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }
  
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
      <MobileSidebar lang={lang} isRTL={isRTL} />

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <MobileMenuButton lang={lang} isRTL={isRTL} />
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              {/* Search bar can be added here if needed */}
            </div>
            
            <div className={`flex items-center ${isRTL ? "ml-0 mr-4" : "ml-4"}`}>
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
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Client component for mobile menu
function MobileSidebar({ lang, isRTL }: { lang: string, isRTL: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <div
            className={`fixed top-0 h-full w-72 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
              isRTL ? "right-0" : "left-0"
            }`}
          >
            {/* Close Button */}
            <div className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} z-10`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Sidebar Content */}
            <DashboardSidebar lang={lang} isMobile={true} onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}

// Mobile Menu Button Component
function MobileMenuButton({ lang, isRTL }: { lang: string, isRTL: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      onClick={() => {
        const sidebar = document.querySelector('.mobile-sidebar') as HTMLElement
        if (sidebar) {
          sidebar.style.transform = 'translateX(0)'
        }
      }}
    >
      <Menu className="h-6 w-6" />
      <span className="sr-only">Open sidebar</span>
    </Button>
  )
}
