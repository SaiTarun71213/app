'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type AgeGroup = 'nursery' | 'lkg' | 'ukg'

type Child = {
  id: string
  full_name: string
  date_of_birth: string
  age_group: AgeGroup
  admission_date: string | null
  parent_name: string | null
  parent_phone: string | null
}

type AttendanceStatus = 'present' | 'absent' | 'late'

type AttendanceRow = {
  date: string
  status: AttendanceStatus
}

const coral = '#FF6B6B'

function ageGroupLabel(age_group: AgeGroup) {
  if (age_group === 'nursery') return 'Nursery'
  if (age_group === 'lkg') return 'LKG'
  return 'UKG'
}

function ageGroupBadgeClass(age_group: AgeGroup) {
  if (age_group === 'nursery') return 'bg-[#E3F4FF] text-foreground'
  if (age_group === 'lkg') return 'bg-[#FFF6D9] text-foreground'
  return 'bg-[#FFE3E8] text-foreground'
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toDateInputValue(d: Date) {
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  return `${y}-${m}-${day}`
}

function monthLabel(index1Based: number) {
  const d = new Date(2000, index1Based - 1, 1)
  return d.toLocaleString(undefined, { month: 'long' })
}

function dayOfWeekMonday0(date: Date) {
  // getDay(): 0=Sunday..6=Saturday
  // We want Monday=0..Sunday=6
  return (date.getDay() + 6) % 7
}

function dotForStatus(status: AttendanceStatus | null) {
  if (status === 'present') return <span aria-label="present" className="text-[10px]">🟢</span>
  if (status === 'absent') return <span aria-label="absent" className="text-[10px]">🔴</span>
  if (status === 'late') return <span aria-label="late" className="text-[10px]">🟡</span>
  return <span aria-label="not marked" className="text-[10px]">⚪</span>
}

export default function ParentChildPage() {
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<Child | null>(null)
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([])

  const now = useMemo(() => new Date(), [])
  const currentMonthIndex = now.getMonth() // 0-11
  const currentYear = now.getFullYear()
  const startOfMonth = useMemo(() => new Date(currentYear, currentMonthIndex, 1), [currentMonthIndex, currentYear])
  const endOfMonth = useMemo(() => new Date(currentYear, currentMonthIndex + 1, 0), [currentMonthIndex, currentYear])

  const startIso = useMemo(() => toDateInputValue(startOfMonth), [startOfMonth])
  const endIso = useMemo(() => toDateInputValue(endOfMonth), [endOfMonth])

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        if (!ignore) {
          setChild(null)
          setLoading(false)
        }
        return
      }

      const { data: childData } = await supabase
        .from('students')
        .select('id,full_name,date_of_birth,age_group,admission_date,parent_name,parent_phone,status')
        .eq('parent_id', user.id)
        .eq('status', 'active')
        .single<Child>()

      if (ignore) return
      setChild(childData ?? null)

      if (!childData) {
        setAttendanceRows([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('attendance')
        .select('date,status')
        .eq('student_id', childData.id)
        .gte('date', startIso)
        .lte('date', endIso)

      if (ignore) return
      setAttendanceRows((data ?? []) as AttendanceRow[])
      setLoading(false)
    }

    void load()
    return () => {
      ignore = true
    }
  }, [startIso, endIso])

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    for (const row of attendanceRows) map.set(row.date, row.status)
    return map
  }, [attendanceRows])

  const stats = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    for (const row of attendanceRows) {
      if (row.status === 'present') present += 1
      else if (row.status === 'absent') absent += 1
      else if (row.status === 'late') late += 1
    }
    const marked = present + absent + late
    const pct = marked === 0 ? 0 : Math.round(((present + late) / marked) * 100)
    return { present, absent, late, marked, pct }
  }, [attendanceRows])

  const daysInMonth = endOfMonth.getDate()
  const startOffset = dayOfWeekMonday0(startOfMonth)
  const totalCells = 42 // 6 weeks

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

  const monthName = monthLabel(currentMonthIndex + 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Child</h1>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold text-foreground">{child.full_name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', ageGroupBadgeClass(child.age_group))}>
              {ageGroupLabel(child.age_group)}
            </span>
            <span className="text-sm text-muted-foreground">
              Date of birth: {new Date(child.date_of_birth).toLocaleDateString()}
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Admission Date</p>
              <p className="font-semibold text-foreground">
                {child.admission_date ? new Date(child.admission_date).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parent</p>
              <p className="font-semibold text-foreground">{child.parent_name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{child.parent_phone ?? ''}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground">
          This Month&apos;s Attendance: {monthName} {currentYear}
        </h2>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2 text-center">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - startOffset + 1
            if (dayNum < 1 || dayNum > daysInMonth) {
              return <div key={`blank-${idx}`} className="h-10" />
            }
            const date = new Date(currentYear, currentMonthIndex, dayNum)
            const iso = toDateInputValue(date)
            const status = attendanceByDate.get(iso) ?? null

            return (
              <div key={iso} className="h-10 rounded-xl border bg-muted/20 p-1">
                <div className="text-[11px] font-semibold text-foreground">{dayNum}</div>
                <div className="mt-1 flex items-center justify-center">{dotForStatus(status)}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#E7FFF2] p-4">
            <p className="text-xs font-semibold text-muted-foreground">Present</p>
            <p className="mt-1 text-xl font-bold text-foreground">{stats.present}</p>
          </div>
          <div className="rounded-2xl bg-[#FFE3E8] p-4">
            <p className="text-xs font-semibold text-muted-foreground">Absent</p>
            <p className="mt-1 text-xl font-bold text-foreground">{stats.absent}</p>
          </div>
          <div className="rounded-2xl bg-[#FFF6D9] p-4">
            <p className="text-xs font-semibold text-muted-foreground">Late</p>
            <p className="mt-1 text-xl font-bold text-foreground">{stats.late}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Attendance %: <span className="font-bold text-foreground">{stats.pct}%</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            (Present + Late) / Total Marked Days
          </p>
        </div>
      </section>
    </div>
  )
}

