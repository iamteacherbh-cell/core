'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client' // <--- تم تصحيح المسار هنا

type SupabaseContextType = {
  user: User | null
  loading: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  loading: true,
})

// هذا هو الـ Provider الذي سيغلف تطبيقك
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // جلب الجلسة الحالية عند تحميل المكون
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // الاستماع لأي تغيير في حالة المصادقة (تسجيل دخول، خروج، إلخ)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

// هذا هو Hook مخصص لسهولة الوصول إلى بيانات المستخدم في أي مكان
export const useSupabaseUser = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabaseUser must be used within a SupabaseProvider')
  }
  return context
}
