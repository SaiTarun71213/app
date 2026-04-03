'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type AgeGroup = 'nursery' | 'lkg' | 'ukg'

type Child = {
  id: string
  age_group: AgeGroup
}

type AnnouncementRow = {
  id: string
  title: string
  message: string
  target: 'all' | 'nursery' | 'lkg' | 'ukg' | 'teachers'
  created_at: string
}

function targetLabel(t: AnnouncementRow['target']) {
  if (t === 'all') return 'All'
  if (t === 'nursery') return 'Nursery'
  if (t === 'lkg') return 'LKG'
  if (t === 'ukg') return 'UKG'
  return 'Teachers'
}

function targetBadgeClass(t: AnnouncementRow['target']) {
  if (t === 'all') return 'bg-[#E3F4FF] text-foreground'
  if (t === 'nursery') return 'bg-[#FFF6D9] text-foreground'
  if (t === 'lkg') return 'bg-[#E7FFF2] text-foreground'
  if (t === 'ukg') return 'bg-[#FFE3E8] text-foreground'
  return 'bg-muted text-foreground'
}

export default function ParentAnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<Child | null>(null)
  const [rows, setRows] = useState<AnnouncementRow[]>([])

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        if (!ignore) setLoading(false)
        return
      }

      const { data: childData } = await supabase
        .from('students')
        .select('id,age_group')
        .eq('parent_id', user.id)
        .eq('status', 'active')
        .single<Child>()

      if (ignore) return
      setChild(childData ?? null)

      if (!childData) {
        setRows([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('announcements')
        .select('id,title,message,target,created_at')
        .in('target', [childData.age_group, 'all'])
        .order('created_at', { ascending: false })

      if (ignore) return
      setRows((data ?? []) as AnnouncementRow[])
      setLoading(false)
    }

    void load()
    return () => {
      ignore = true
    }
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (!child) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Your child has not been enrolled yet. Please contact the school.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Notices</h1>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((a) => (
            <div key={a.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.message}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', targetBadgeClass(a.target))}>
                  {targetLabel(a.target)}
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

