'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ClassName = 'nursery' | 'lkg' | 'ukg'

type Child = {
  id: string
  full_name: string
  age_group: ClassName
  admission_date: string | null
}

type AttendanceStatus = 'present' | 'absent' | 'late'

type Announcement = {
  title: string
  message: string
  created_at: string
  target: string
}

type DiaryEntry = {
  date: string
  content: string
}

const coral = '#FF6B6B'

function ageGroupLabel(a: ClassName) {
  if (a === 'nursery') return 'Nursery'
  if (a === 'lkg') return 'LKG'
  return 'UKG'
}

function formatAttendanceBadge(status: 'none' | AttendanceStatus) {
  if (status === 'present') return { label: 'Present', className: 'bg-[#E7FFF2] text-foreground' }
  if (status === 'absent') return { label: 'Absent', className: 'bg-[#FFE3E8] text-foreground' }
  if (status === 'late') return { label: 'Late', className: 'bg-[#FFF6D9] text-foreground' }
  return { label: 'Not Marked Yet', className: 'bg-muted text-foreground' }
}

function formatAnnouncementMessage(message: string) {
  const trimmed = message.trim()
  if (trimmed.length <= 100) return trimmed
  return `${trimmed.slice(0, 100)}…`
}

export default function ParentDashboardPage() {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [loading, setLoading] = useState(true)
  const [parentName, setParentName] = useState<string>('Parent')
  const [child, setChild] = useState<Child | null>(null)

  const [attendanceStatus, setAttendanceStatus] = useState<'none' | AttendanceStatus>('none')
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [latestDiary, setLatestDiary] = useState<DiaryEntry | null>(null)

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

      const [{ data: profile }, { data: childData }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single<{ full_name: string | null }>(),
        supabase
          .from('students')
          .select('id,full_name,age_group,admission_date')
          .eq('parent_id', user.id)
          .eq('status', 'active')
          .single<Child>(),
      ])

      if (ignore) return
      setParentName(profile?.full_name || 'Parent')
      setChild(childData ?? null)

      if (!childData) {
        setLoading(false)
        return
      }

      const [{ data: attendanceRows }, { data: announceRows }, { data: diaryRows }] = await Promise.all([
        supabase.from('attendance').select('status').eq('student_id', childData.id).eq('date', todayIso).limit(1),
        supabase
          .from('announcements')
          .select('title,message,created_at,target')
          .in('target', [childData.age_group, 'all'])
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('diary_entries')
          .select('date,content')
          .eq('class', childData.age_group)
          .order('date', { ascending: false })
          .limit(1),
      ])

      if (ignore) return
      const att = (attendanceRows?.[0]?.status as AttendanceStatus | undefined) ?? null
      setAttendanceStatus(att ?? 'none')
      setAnnouncement(announceRows?.[0] ?? null)
      setLatestDiary(diaryRows?.[0] ?? null)
      setLoading(false)
    }

    void load()
    return () => {
      ignore = true
    }
  }, [todayIso])

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

  const badge = formatAttendanceBadge(attendanceStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Hello, {parentName}! 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">Child Info</h2>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-semibold text-foreground">{child.full_name}</p>
            <p className="text-sm text-muted-foreground">Age Group</p>
            <p className="font-semibold text-foreground">{ageGroupLabel(child.age_group)}</p>
            <p className="text-sm text-muted-foreground">Admission Date</p>
            <p className="font-semibold text-foreground">
              {child.admission_date ? new Date(child.admission_date).toLocaleDateString() : '—'}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">Today&apos;s Attendance</h2>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-semibold text-foreground">{new Date(todayIso).toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">Status</p>
            <span className={cn('inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-semibold', badge.className)}>
              {badge.label}
            </span>
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">Latest Notice</h2>
          {announcement ? (
            <div className="mt-3 space-y-2">
              <p className="font-semibold text-foreground">{announcement.title}</p>
              <p className="text-sm text-muted-foreground">{formatAnnouncementMessage(announcement.message)}</p>
              <p className="text-xs text-muted-foreground">{new Date(announcement.created_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No announcements yet.</p>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">Latest Diary Entry</h2>
          {latestDiary ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted-foreground">{new Date(latestDiary.date).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">{formatAnnouncementMessage(latestDiary.content)}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No diary entries yet.</p>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Button asChild className="flex-1 h-11" style={{ backgroundColor: coral, color: 'white' }}>
          <Link href="/parent/child">View Attendance</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-11">
          <Link href="/parent/fees">View Fees</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-11">
          <Link href="/parent/diary">View Diary</Link>
        </Button>
      </div>
    </div>
  )
}

