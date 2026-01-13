"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/i18n"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  const { language } = useLanguage()
  const t = useTranslation(language)

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />

      <div className="container">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>{language === "ar" ? "منصة جديدة للمحترفين" : "New Platform for Professionals"}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">{t.heroTitle}</h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl">{t.heroSubtitle}</p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button size="lg" asChild className="text-lg">
              <Link href="/signup">
                {t.getStarted}
                <ArrowRight className={`h-5 w-5 ${language === "ar" ? "rotate-180" : ""}`} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg bg-transparent">
              <Link href="/#features">{t.learnMore}</Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mt-8 text-sm text-muted-foreground px-4">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-center">{language === "ar" ? "محترف نشط" : "Active Professionals"}</div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-foreground">10K+</div>
              <div className="text-center">{language === "ar" ? "رسالة مرسلة" : "Messages Sent"}</div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-foreground">98%</div>
              <div className="text-center">{language === "ar" ? "رضا العملاء" : "Satisfaction"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
