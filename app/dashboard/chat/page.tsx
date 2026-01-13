import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(1)

  let session = sessions?.[0]

  if (!session) {
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: profile?.language === "ar" ? "محادثة جديدة" : "New Chat",
      })
      .select()
      .single()

    session = newSession
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", session?.id || "")
    .order("created_at", { ascending: true })

  return (
    <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] flex flex-col p-2 sm:p-4 md:p-6">
      <div className="mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-balance">
          {profile?.language === "ar" ? "المحادثات" : "Chat"}
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {profile?.language === "ar" ? "تواصل مع الذكاء الاصطناعي" : "Chat with AI Assistant"}
        </p>
      </div>

      {session && (
        <div className="flex-1 min-h-0">
          <ChatInterface
            sessionId={session.id}
            userId={user.id}
            initialMessages={messages || []}
            userLanguage={profile?.language || "en"}
          />
        </div>
      )}
    </div>
  )
}
