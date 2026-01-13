"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useSupabaseUser } from '@/app/providers' // === تحديث: استيراد Hook المستخدم
import { supabase } from '@/utils/supabase/browser' // === تحديث: استيراد العميل المفيد
import type { Language } from "@/lib/i18n"
import { toast } from "sonner"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dir: "rtl" | "ltr"
  loading: boolean // === تحديث: إضافة حالة تحميل
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabaseUser(); // === تحديث: الحصول على المستخدم الحالي
  const [language, setLanguageState] = useState<Language>("ar")
  const [loading, setLoading] = useState(true) // === تحديث: حالة تحميل أولية

  // === تحديث: دالة لجلب لغة المستخدم من قاعدة البيانات
  const fetchUserLanguage = async () => {
    if (!user) {
      // إذا لم يكن هناك مستخدم، استخدم اللغة من localStorage كحل احتياطي
      const saved = localStorage.getItem("language") as Language;
      if (saved) {
        setLanguageState(saved);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user language:", error);
        // في حالة الخطأ، استخدم اللغة من localStorage
        const saved = localStorage.getItem("language") as Language;
        if (saved) {
          setLanguageState(saved);
        }
      } else if (data?.language) {
        // إذا وجدنا لغة المستخدم في قاعدة البيانات، استخدمها
        setLanguageState(data.language);
        localStorage.setItem("language", data.language); // مزامنة localStorage
      } else {
        // إذا لم يكن لدى المستخدم لغة محفوظة، استخدم localStorage
        const saved = localStorage.getItem("language") as Language;
        if (saved) {
          setLanguageState(saved);
        }
      }
    } catch (error) {
      console.error("Error in fetchUserLanguage:", error);
    } finally {
      setLoading(false);
    }
  };

  // === تحديث: جلب اللغة عند تحميل المكون أو عند تغيير المستخدم
  useEffect(() => {
    fetchUserLanguage();
  }, [user]); // يعاد التشغيل عندما يتغير المستخدم (تسجيل دخول/خروج)

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"

    // === تحديث: حفظ اللغة الجديدة في قاعدة البيانات إذا كان المستخدم مسجل دخول
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('id', user.id);

        if (error) {
          console.error("Error updating user language:", error);
          toast.error("فشل في حفظ إعدادات اللغة");
        }
      } catch (error) {
        console.error("Error in setLanguage:", error);
      }
    }
  };

  // === تحديث: تحديث اتجاه الصفحة عند تغيير اللغة
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir: language === "ar" ? "rtl" : "ltr", loading }}>
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
