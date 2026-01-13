"use client"

import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/i18n"
import { MessageSquare, Send, Users, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Features() {
  const { language } = useLanguage()
  const t = useTranslation(language)

  const features = [
    {
      icon: MessageSquare,
      title: t.smartChat,
      description: t.smartChatDesc,
    },
    {
      icon: Send,
      title: t.telegramIntegration,
      description: t.telegramIntegrationDesc,
    },
    {
      icon: Users,
      title: t.professionalNetwork,
      description: t.professionalNetworkDesc,
    },
    {
      icon: Shield,
      title: t.secureData,
      description: t.secureDataDesc,
    },
  ]

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.features}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "ar"
              ? "أدوات قوية لبناء شبكتك المهنية وتطوير أعمالك"
              : "Powerful tools to build your professional network and grow your business"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
