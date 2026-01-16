"use client"

import { useEffect } from "react"
import { DashboardSidebar } from "./sidebar"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface MobileSidebarWrapperProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebarWrapper({ isOpen, onClose }: MobileSidebarWrapperProps) {
  const { language } = useLanguage()
  const isRTL = language === "ar"

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 h-full w-72 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isRTL ? "right-0" : "left-0"
        )}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Sidebar Content */}
        <DashboardSidebar isMobile={true} onClose={onClose} />
      </div>
    </>
  )
}
