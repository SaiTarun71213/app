import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'admin' | 'teacher' | 'parent'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Get the access token from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  let user = null

  if (accessToken && refreshToken) {
    const { data } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    user = data.user
  }

  const pathname = request.nextUrl.pathname

  // Protected routes configuration
  const protectedRoutes: { prefix: string; allowedRole: UserRole }[] = [
    { prefix: '/admin', allowedRole: 'admin' },
    { prefix: '/teacher', allowedRole: 'teacher' },
    { prefix: '/parent', allowedRole: 'parent' },
  ]

  // Check if current path matches any protected route
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route.prefix)) {
      // Not logged in - redirect to login
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      // Check role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // No profile or wrong role - redirect to login
      if (!profile || profile.role !== route.allowedRole) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
