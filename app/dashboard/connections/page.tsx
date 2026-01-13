import { createSupabaseServerClient } from '@/utils/supabase/server'; // <--- الاستيراد الصحيح للخادم
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default async function ConnectionsPage() {
  const supabase = createSupabaseServerClient(); // <--- استخدام المساعد الصحيح
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: connections } = await supabase
    .from("connections")
    .select(
      `
      *,
      requester:requester_id(full_name, email),
      receiver:receiver_id(full_name, email)
    `,
    )
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{profile?.language === "ar" ? "العلاقات" : "Connections"}</h1>
        <p className="text-muted-foreground">
          {profile?.language === "ar" ? "شبكتك المهنية" : "Your professional network"}
        </p>
      </div>

      {!connections || connections.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {profile?.language === "ar" ? "لا توجد علاقات بعد" : "No connections yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection: any) => {
            const otherUser = connection.requester_id === user.id ? connection.receiver : connection.requester
            const initials = otherUser?.full_name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()

            return (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base">{otherUser?.full_name}</CardTitle>
                      <CardDescription className="text-xs">{otherUser?.email}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        connection.status === "accepted"
                          ? "default"
                          : connection.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {connection.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
