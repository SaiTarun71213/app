import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const isPublicMarketingPage =
    path === '/' ||
    path === '/about' ||
    path === '/admissions' ||
    path === '/gallery' ||
    path === '/contact'

  const isProtected =
    path.startsWith('/admin') || path.startsWith('/teacher') || path.startsWith('/parent')

  if (!user && isProtected) return NextResponse.redirect(new URL('/login', request.url))

  // If logged in, enforce role-based access (prevents cross-role route access).
  // Also allows redirecting away from /login when already authenticated.
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as 'admin' | 'teacher' | 'parent' | undefined

    const roleHome =
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'teacher'
          ? '/teacher/dashboard'
          : role === 'parent'
            ? '/parent/dashboard'
            : null

    // If already authenticated, keep them in their role area
    // instead of public marketing/auth pages.
    if ((isPublicMarketingPage || path === '/login') && roleHome) {
      return NextResponse.redirect(new URL(roleHome, request.url))
    }

    if (isProtected) {
      const allowed =
        (path.startsWith('/admin') && role === 'admin') ||
        (path.startsWith('/teacher') && role === 'teacher') ||
        (path.startsWith('/parent') && role === 'parent')

      if (!allowed) {
        return NextResponse.redirect(new URL(roleHome ?? '/login', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/about',
    '/admissions',
    '/gallery',
    '/contact',
    '/login',
    '/admin/:path*',
    '/teacher/:path*',
    '/parent/:path*',
  ],
}
