'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/auth/logout-button'
import { parentNavItems } from './parent-nav'
import { cn } from '@/lib/utils'

type ChildRecord = {
  id: string
  full_name: string
  age_group: 'nursery' | 'lkg' | 'ukg'
}

const coral = '#FF6B6B'

function formatAgeGroupLabel(age_group: ChildRecord['age_group']) {
  if (age_group === 'nursery') return 'Nursery'
  if (age_group === 'lkg') return 'LKG'
  return 'UKG'
}

export function ParentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeHref = useMemo(() => {
    const match = parentNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
    )
    return match?.href ?? null
  }, [pathname])

  const [child, setChild] = useState<ChildRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadChild() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        if (userErr) {
          if (!ignore) setChild(null)
          return
        }

        const user = userData.user
        if (!user) {
          if (!ignore) setChild(null)
          return
        }

        const { data: student, error: childErr } = await supabase
          .from('students')
          .select('id,full_name,age_group')
          .eq('parent_id', user.id)
          .eq('status', 'active')
          .single<ChildRecord>()

        if (childErr) {
          if (!ignore) setChild(null)
          return
        }

        if (!ignore) setChild(student ?? null)
      } catch {
        if (!ignore) setChild(null)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void loadChild()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground">Little Stars</p>
            <p className="truncate text-sm font-semibold text-muted-foreground">
              {loading ? 'Loading…' : child ? `${child.full_name}` : ''}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !child ? (
          <div className="rounded-2xl border bg-card p-6">
            <h1 className="text-2xl font-bold text-foreground">Parent Portal</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your child has not been enrolled yet. Please contact the school.
            </p>
          </div>
        ) : (
          children
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
        {child ? (
          <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1 px-2 py-2">
            {parentNavItems.map((item) => {
              const isActive = activeHref === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                  style={isActive ? { color: coral } : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ) : null}
      </nav>
    </div>
  )
}

