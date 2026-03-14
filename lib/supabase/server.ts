import { createClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// هذه هي الدالة الوحيدة التي يجب تصديرها واستخدامها
export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was not called from a Server Component.
            // This can be ignored if you're not using Server Components.
          }
        },
      },
    }
  )
}
