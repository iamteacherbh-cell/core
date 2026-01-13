"use client"

import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

export function Footer() {
  const { language } = useLanguage()

  return (
    <footer className="border-t py-12 bg-muted/30">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                iC
              </div>
              <span className="font-bold text-xl">icore.life</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              {language === "ar"
                ? "منصتك المهنية للتواصل الذكي وبناء العلاقات التجارية"
                : "Your professional platform for smart communication and business networking"}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{language === "ar" ? "روابط سريعة" : "Quick Links"}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/#features" className="hover:text-foreground transition-colors">
                  {language === "ar" ? "المميزات" : "Features"}
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-foreground transition-colors">
                  {language === "ar" ? "الأسعار" : "Pricing"}
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-foreground transition-colors">
                  {language === "ar" ? "اتصل بنا" : "Contact"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{language === "ar" ? "قانوني" : "Legal"}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  {language === "ar" ? "شروط الاستخدام" : "Terms of Service"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
          <p>© 2026 icore.life. {language === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}</p>
        </div>
      </div>
    </footer>
  )
}
