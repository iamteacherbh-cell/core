import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TelegramMessagesTable } from "@/components/admin/telegram-messages-table"

export default async function AdminMessagesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Telegram Messages</h1>
        <p className="text-muted-foreground">رسائل المستخدمين من Telegram | User messages from Telegram</p>
      </div>
      <TelegramMessagesTable />
    </div>
  )
}
