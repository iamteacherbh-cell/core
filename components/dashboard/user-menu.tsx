"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/i18n"
import { 
  Globe, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  CreditCard,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface UserMenuProps {
  user: {
    email: string
    fullName?: string
    avatarUrl?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const { language, setLanguage } = useLanguage()
  const t = useTranslation(language)
  const router = useRouter()
  const isRTL = language === "ar"

  const initials =
    user.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user.email[0].toUpperCase()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "relative h-auto p-1 sm:p-2 flex items-center gap-2 rounded-md hover:bg-muted transition-colors",
            isRTL && "flex-row-reverse"
          )}
        >
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.fullName || user.email} />
            <AvatarFallback className="text-xs sm:text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <p className="text-sm font-medium truncate max-w-[120px]">
              {user.fullName || user.email.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
              {user.email}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 hidden sm:block text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-56",
          isRTL && "rtl"
        )}
        forceMount
      >
        <DropdownMenuLabel className={cn("flex flex-col space-y-1", isRTL && "items-end")}>
          <p className="text-sm font-medium leading-none">{user.fullName || user.email}</p>
          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => router.push("/dashboard/settings")}
          className={cn("cursor-pointer", isRTL && "flex-row-reverse")}
        >
          <User className={cn("h-4 w-4", isRTL ? "ml-2 mr-0" : "mr-2 ml-0")} />
          {language === "ar" ? "الملف الشخصي" : "Profile"}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push("/dashboard/subscription")}
          className={cn("cursor-pointer", isRTL && "flex-row-reverse")}
        >
          <CreditCard className={cn("h-4 w-4", isRTL ? "ml-2 mr-0" : "mr-2 ml-0")} />
          {language === "ar" ? "الاشتراك" : "Subscription"}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push("/dashboard/help")}
          className={cn("cursor-pointer", isRTL && "flex-row-reverse")}
        >
          <HelpCircle className={cn("h-4 w-4", isRTL ? "ml-2 mr-0" : "mr-2 ml-0")} />
          {language === "ar" ? "المساعدة" : "Help"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          className={cn("cursor-pointer", isRTL && "flex-row-reverse")}
        >
          <Globe className={cn("h-4 w-4", isRTL ? "ml-2 mr-0" : "mr-2 ml-0")} />
          {language === "ar" ? "English" : "العربية"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          className={cn("cursor-pointer text-red-600 focus:text-red-600", isRTL && "flex-row-reverse")}
        >
          <LogOut className={cn("h-4 w-4", isRTL ? "ml-2 mr-0" : "mr-2 ml-0")} />
          {language === "ar" ? "تسجيل الخروج" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
