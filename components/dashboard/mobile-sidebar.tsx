"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface MobileSidebarProps {
  children: React.ReactNode
  lang: string
}

export function MobileSidebar({ children, lang }: MobileSidebarProps) {
  const isRTL = lang === "ar"

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const sidebar = document.getElementById('mobile-sidebar')
        sidebar?.classList.add('-translate-x-full')
        sidebar?.classList.remove('translate-x-0')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        id="mobile-sidebar-overlay"
        className="fixed inset-0 z-40 md:hidden"
        onClick={() => {
          const sidebar = document.getElementById('mobile-sidebar')
          sidebar?.classList.add('-translate-x-full')
          sidebar?.classList.remove('translate-x-0')
        }}
        style={{ display: 'none' }}
      />

      {/* Mobile sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-64 bg-white transform -translate-x-full transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {lang === "ar" ? "القائمة" : "Menu"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const sidebar = document.getElementById('mobile-sidebar')
              const overlay = document.getElementById('mobile-sidebar-overlay')
              sidebar?.classList.add('-translate-x-full')
              sidebar?.classList.remove('translate-x-0')
              if (overlay) overlay.style.display = 'none'
            }}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        
        <div className="flex-1 h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
