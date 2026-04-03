'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type ClassName = 'nursery' | 'lkg' | 'ukg'

function classLabel(c: ClassName) {
  if (c === 'nursery') return 'Nursery'
  if (c === 'lkg') return 'LKG'
  return 'UKG'
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function TeacherDashboardPage() {
  const [teacherName, setTeacherName] = useState('Teacher')
  const [assignedClass, setAssignedClass] = useState<ClassName | null>(null)
  const [studentsCount, setStudentsCount] = useState(0)
  const [markedTodayCount, setMarkedTodayCount] = useState(0)
  const [latestAnnouncement, setLatestAnnouncement] = useState<{
    title: string
    message: string
    created_at: string
    target: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [missingClass, setMissingClass] = useState(false)

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])

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

      const [{ data: profile }, { data: teacher }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single<{ full_name: string | null }>(),
        supabase
          .from('teachers')
          .select('assigned_class')
          .eq('id', user.id)
          .single<{ assigned_class: ClassName | null }>(),
      ])

      if (ignore) return
      setTeacherName(profile?.full_name || 'Teacher')

      if (!teacher?.assigned_class) {
        setMissingClass(true)
        setLoading(false)
        return
      }

      const cls = teacher.assigned_class
      setAssignedClass(cls)
      setMissingClass(false)

      const [{ count: classStudentCount }, { count: markedCount }, { data: latest }] = await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('age_group', cls)
          .eq('status', 'active'),
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('marked_by', user.id)
          .eq('date', todayIso),
        supabase
          .from('announcements')
          .select('title,message,created_at,target')
          .in('target', ['all', 'teachers'])
          .order('created_at', { ascending: false })
          .limit(1),
      ])

      if (ignore) return
      setStudentsCount(classStudentCount ?? 0)
      setMarkedTodayCount(markedCount ?? 0)
      setLatestAnnouncement(latest?.[0] ?? null)
      setLoading(false)
    }

    void load()
    return () => {
      ignore = true
    }
  }, [todayIso])

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (missingClass) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have not been assigned a class yet. Please contact admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          {greeting()}, {teacherName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString()} • {assignedClass ? classLabel(assignedClass) : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-[#FFF6D9] p-5">
          <p className="text-sm font-semibold text-muted-foreground">Students in my class</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{studentsCount}</p>
        </div>
        <div className="rounded-2xl bg-[#E3F4FF] p-5">
          <p className="text-sm font-semibold text-muted-foreground">Marked today</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{markedTodayCount}</p>
        </div>
        <div className="rounded-2xl bg-[#E7FFF2] p-5">
          <p className="text-sm font-semibold text-muted-foreground">Latest announcement</p>
          {latestAnnouncement ? (
            <div className="mt-2">
              <p className="font-semibold text-foreground">{latestAnnouncement.title}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{latestAnnouncement.message}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No announcements yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-11" style={{ backgroundColor: '#FF6B6B', color: 'white' }}>
          <Link href="/teacher/attendance">Mark Attendance</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link href="/teacher/diary">Write Diary</Link>
        </Button>
      </div>
    </div>
  )
}
