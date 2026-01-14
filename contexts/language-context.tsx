"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Language } from "@/lib/i18n"
import { createClient } from '@/utils/supabase/browser' // استيراد عميل المتصفح
import { useSupabaseUser } from '@/app/providers' // استيراد هوك المستخدم

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dir: "rtl" | "ltr"
  isLoading: boolean // إضافة حالة تحميل
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar")
  const [isLoading, setIsLoading] = useState(true) // نبدأ بحالة تحميل
  const { user } = useSupabaseUser(); // الحصول على بيانات المستخدم
  const supabase = createClient(); // إنشاء عميل Supabase

  // useEffect لجلب اللغة عند تحميل المكون أو عند تغيير المستخدم
  useEffect(() => {
    async function loadLanguage() {
      setIsLoading(true);
      
      // 1. إذا كان المستخدم مسجل دخوله، حاول جلب لغته من Supabase
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (data && data.language) {
          setLanguageState(data.language);
        } else {
          // 2. إذا لم توجد لغة في البروفايل، استخدم اللغة المحفوظة محليًا
          const saved = localStorage.getItem("language") as Language;
          if (saved) {
            setLanguageState(saved);
          }
        }
      } else {
        // 3. إذا لم يكن المستخدم مسجل دخوله، استخدم اللغة المحفوظة محليًا
        const saved = localStorage.getItem("language") as Language;
        if (saved) {
          setLanguageState(saved);
        }
      }
      
      setIsLoading(false);
    }

    loadLanguage();
  }, [user]); // يعاد التشغيل فقط عندما يتغير المستخدم

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    // إذا كان المستخدم مسجل دخوله، قم بتحديث لغته في Supabase
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          language: lang,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error updating language in profile:", error);
      }
    }
  }

  useEffect(() => {
    // تحديث اتجاه الصفحة عند تغيير اللغة
    document.documentElement.lang = language
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir: language === "ar" ? "rtl" : "ltr", isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
