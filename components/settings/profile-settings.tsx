"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, Briefcase, Globe, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileSettingsProps {
  user: any
  profile: any
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    bio: profile?.bio || "",
    position: profile?.position || "",
    industry: profile?.industry || "",
    website: profile?.website || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.refresh()
        alert(profile?.language === "ar" ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert(profile?.language === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving changes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-3 sm:space-y-4 md:space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg md:text-xl">
            {profile?.language === "ar" ? "الصورة الشخصية" : "Profile Picture"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {profile?.language === "ar" ? "صورتك التي تظهر للآخرين" : "Your avatar visible to others"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-lg sm:text-xl md:text-2xl">
              <User className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
            <Button variant="outline" size="sm" type="button" className="text-xs sm:text-sm bg-transparent">
              {profile?.language === "ar" ? "تغيير الصورة" : "Change Picture"}
            </Button>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
              {profile?.language === "ar" ? "JPG، PNG أو GIF. حجم أقصى 2MB" : "JPG, PNG or GIF. Max 2MB"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg md:text-xl">
            {profile?.language === "ar" ? "المعلومات الشخصية" : "Personal Information"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {profile?.language === "ar" ? "معلوماتك الأساسية" : "Your basic information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-xs sm:text-sm flex items-center gap-2">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile?.language === "ar" ? "الاسم الكامل" : "Full Name"}
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm flex items-center gap-2">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile?.language === "ar" ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="text-sm h-9 sm:h-10 bg-muted"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs sm:text-sm flex items-center gap-2">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile?.language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-xs sm:text-sm flex items-center gap-2">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile?.language === "ar" ? "الشركة" : "Company"}
              </Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="text-sm h-9 sm:h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-xs sm:text-sm">
              {profile?.language === "ar" ? "نبذة تعريفية" : "Bio"}
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="text-sm resize-none"
              placeholder={profile?.language === "ar" ? "أخبرنا عن نفسك..." : "Tell us about yourself..."}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg md:text-xl">
            {profile?.language === "ar" ? "المعلومات المهنية" : "Professional Information"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {profile?.language === "ar" ? "معلوماتك العملية" : "Your work-related details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position" className="text-xs sm:text-sm">
                {profile?.language === "ar" ? "المسمى الوظيفي" : "Job Title"}
              </Label>
              <Input
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-xs sm:text-sm">
                {profile?.language === "ar" ? "المجال" : "Industry"}
              </Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="text-sm h-9 sm:h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-xs sm:text-sm flex items-center gap-2">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              {profile?.language === "ar" ? "الموقع الإلكتروني" : "Website"}
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              className="text-sm h-9 sm:h-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0 bg-background pt-3 pb-2">
        <Button
          variant="outline"
          type="button"
          className="text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto bg-transparent"
        >
          {profile?.language === "ar" ? "إلغاء" : "Cancel"}
        </Button>
        <Button type="submit" disabled={loading} className="text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto">
          {loading && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />}
          {profile?.language === "ar" ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
