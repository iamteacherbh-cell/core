import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // إنشاء استجابة أولية
  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: process.env.NODE_ENV === 'production' ? '.icore.life' : undefined,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user?.email || 'none'}`)

  // السماح بالوصول إلى الصفحات العامة
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/login1') {
    return supabaseResponse
  }

  // حماية مسار dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      console.log(`[Middleware] No user, redirecting to login from: ${request.nextUrl.pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
