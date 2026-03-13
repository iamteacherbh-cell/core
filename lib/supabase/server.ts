import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// الدالة الأساسية التي نستخدمها في صفحة dashboard
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
            // يتم تجاهل الخطأ إذا كان في Server Component
          }
        },
      },
    }
  )
}

// ✅ تصدير createServerClient مباشرة للتوافق مع الكود القديم
export const createServerClient = createSupabaseServerClient
