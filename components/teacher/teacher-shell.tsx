'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/auth/logout-button'
import { cn } from '@/lib/utils'
import { teacherNavItems } from './teacher-nav'

type Props = {
  children: React.ReactNode
}

const coral = '#FF6B6B'

export function TeacherShell({ children }: Props) {
  const pathname = usePathname()
  const [teacherName, setTeacherName] = useState('Teacher')
  const [loadingName, setLoadingName] = useState(true)

  const activeHref = useMemo(() => {
    const match = teacherNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
    )
    return match?.href ?? null
  }, [pathname])

  useEffect(() => {
    let ignore = false

    async function loadTeacherName() {
      setLoadingName(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        if (!ignore) setLoadingName(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single<{ full_name: string | null }>()

      if (ignore) return
      setTeacherName(profile?.full_name || 'Teacher')
      setLoadingName(false)
    }

    void loadTeacherName()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-bold text-foreground">Little Stars</span>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-sm font-semibold text-foreground sm:inline">
              {loadingName ? 'Loading…' : teacherName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-1 px-2 py-2">
          {teacherNavItems.map(({ href, label, Icon }) => {
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
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

