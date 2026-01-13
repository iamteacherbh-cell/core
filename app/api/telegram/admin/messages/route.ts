import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all telegram messages
    const { data: messages, error } = await supabase
      .from("telegram_admin_messages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return Response.json({ messages })
  } catch (error) {
    console.error("[v0] Error fetching telegram messages:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
