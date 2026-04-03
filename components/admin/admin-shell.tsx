'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/auth/logout-button'
import { adminNavItems } from './admin-nav'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
}

type Profile = {
  full_name: string | null
  role: 'admin' | 'teacher' | 'parent' | string
}

const coral = '#FF6B6B'

export function AdminShell({ children }: Props) {
  const pathname = usePathname()
  const [adminName, setAdminName] = useState<string>('Admin')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const activeHref = useMemo(() => {
    // consider nested routes active too
    const match = adminNavItems.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    return match?.href ?? null
  }, [pathname])

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      setIsLoadingProfile(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      const user = userData.user
      if (!user) {
        if (!ignore) setAdminName('Admin')
        if (!ignore) setIsLoadingProfile(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single<Profile>()

      if (ignore) return
      if (profile?.full_name) setAdminName(profile.full_name)
      setIsLoadingProfile(false)
    }

    void loadProfile()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-[250px] md:flex-col md:border-r md:bg-background">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin/dashboard" className="font-bold text-foreground">
            Little Stars
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {adminNavItems.map(({ href, label, Icon }) => {
            const isActive = activeHref === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                style={isActive ? { borderLeft: `4px solid ${coral}` } : undefined}
              >
                <Icon className={cn('size-4', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                <span className={isActive ? 'text-foreground' : undefined}>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {isLoadingProfile ? 'Loading…' : adminName}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-[250px]">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">Little Stars</span>
              <span className="text-sm text-muted-foreground">Admin</span>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <span className="max-w-[220px] truncate text-sm font-semibold text-foreground">
                {isLoadingProfile ? 'Loading…' : adminName}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-10">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1 px-2 py-2">
            {adminNavItems.slice(0, 5).map(({ href, label, Icon }) => {
              const isActive = activeHref === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" style={isActive ? { color: coral } : undefined} />
                  <span className="leading-none">{label}</span>
                </Link>
              )
            })}
          </div>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-2 pb-2">
            {adminNavItems.slice(5).map(({ href, label, Icon }) => {
              const isActive = activeHref === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
                    isActive ? 'border-transparent bg-muted text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" style={isActive ? { color: coral } : undefined} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

