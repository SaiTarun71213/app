'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ClassName = 'nursery' | 'lkg' | 'ukg'
type AttendanceStatus = 'present' | 'absent' | 'late'

type Student = {
  id: string
  full_name: string
}

type AttendanceRow = {
  student_id: string
  status: AttendanceStatus
}

function classLabel(c: ClassName) {
  if (c === 'nursery') return 'Nursery'
  if (c === 'lkg') return 'LKG'
  return 'UKG'
}

export default function TeacherAttendancePage() {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [assignedClass, setAssignedClass] = useState<ClassName | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [missingClass, setMissingClass] = useState(false)
  const [alreadyMarkedToday, setAlreadyMarkedToday] = useState(false)

  const [pastDate, setPastDate] = useState(todayIso)
  const [pastRows, setPastRows] = useState<Array<{ name: string; status: AttendanceStatus }>>([])
  const [pastLoading, setPastLoading] = useState(false)

  async function loadBase() {
    setLoading(true)
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    const { data: teacher } = await supabase
      .from('teachers')
      .select('assigned_class')
      .eq('id', user.id)
      .single<{ assigned_class: ClassName | null }>()

    if (!teacher?.assigned_class) {
      setMissingClass(true)
      setLoading(false)
      return
    }
    setMissingClass(false)
    setAssignedClass(teacher.assigned_class)

    const { data: classStudents } = await supabase
      .from('students')
      .select('id,full_name')
      .eq('age_group', teacher.assigned_class)
      .eq('status', 'active')
      .order('full_name', { ascending: true })

    const list = (classStudents ?? []) as Student[]
    setStudents(list)
    const defaults = Object.fromEntries(list.map((s) => [s.id, 'present' as AttendanceStatus]))
    setStatusMap(defaults)

    if (list.length > 0) {
      const ids = list.map((s) => s.id)
      const { data: todayRows } = await supabase
        .from('attendance')
        .select('student_id,status')
        .eq('date', todayIso)
        .in('student_id', ids)

      if (todayRows && todayRows.length > 0) {
        setAlreadyMarkedToday(true)
        const existing = Object.fromEntries(
          (todayRows as AttendanceRow[]).map((r) => [r.student_id, r.status]),
        )
        setStatusMap((prev) => ({ ...prev, ...existing }))
      } else {
        setAlreadyMarkedToday(false)
      }
    } else {
      setAlreadyMarkedToday(false)
    }

    setLoading(false)
  }

  async function loadPast(date: string) {
    if (!assignedClass) return
    setPastLoading(true)
    const supabase = createClient()
    const { data: classStudents } = await supabase
      .from('students')
      .select('id,full_name')
      .eq('age_group', assignedClass)
      .eq('status', 'active')
    const list = (classStudents ?? []) as Student[]
    if (list.length === 0) {
      setPastRows([])
      setPastLoading(false)
      return
    }
    const ids = list.map((s) => s.id)
    const { data: rows } = await supabase
      .from('attendance')
      .select('student_id,status')
      .eq('date', date)
      .in('student_id', ids)
    const byId = new Map((rows as AttendanceRow[] | null | undefined)?.map((r) => [r.student_id, r.status]) ?? [])
    setPastRows(list.map((s) => ({ name: s.full_name, status: byId.get(s.id) ?? 'present' })))
    setPastLoading(false)
  }

  useEffect(() => {
    void loadBase()
  }, [todayIso])

  useEffect(() => {
    if (!assignedClass) return
    void loadPast(pastDate)
  }, [assignedClass, pastDate])

  async function submit() {
    if (!userId || students.length === 0) return
    setSubmitting(true)
    const supabase = createClient()
    const payload = students.map((s) => ({
      student_id: s.id,
      date: todayIso,
      status: statusMap[s.id] ?? 'present',
      marked_by: userId,
    }))
    const { error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,date' })
    if (error) {
      toast.error('Failed to mark attendance')
      setSubmitting(false)
      return
    }
    toast.success('Attendance marked successfully')
    setAlreadyMarkedToday(true)
    setSubmitting(false)
    await loadPast(pastDate)
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (missingClass) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have not been assigned a class yet. Please contact admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Mark Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {assignedClass ? classLabel(assignedClass) : ''} • {new Date(todayIso).toLocaleDateString()}
        </p>
        {alreadyMarkedToday ? (
          <p className="mt-1 text-sm font-semibold text-foreground">
            Attendance already submitted today. You can update and re-submit.
          </p>
        ) : null}
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          No students found in your class.
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const selected = statusMap[s.id] ?? 'present'
            return (
              <div key={s.id} className="rounded-2xl border bg-card p-4">
                <p className="font-semibold text-foreground">{s.full_name}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusMap((prev) => ({ ...prev, [s.id]: 'present' }))}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground"
                    style={{ background: selected === 'present' ? '#D1FAE5' : '#F3F4F6' }}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusMap((prev) => ({ ...prev, [s.id]: 'absent' }))}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground"
                    style={{ background: selected === 'absent' ? '#FECACA' : '#F3F4F6' }}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusMap((prev) => ({ ...prev, [s.id]: 'late' }))}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground"
                    style={{ background: selected === 'late' ? '#FEF3C7' : '#F3F4F6' }}
                  >
                    Late
                  </button>
                </div>
              </div>
            )
          })}

          <Button
            type="button"
            className="h-11 w-full"
            style={{ backgroundColor: '#FF6B6B', color: 'white' }}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Attendance'}
          </Button>
        </div>
      )}

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground">Past Attendance (Read only)</h2>
        <div className="mt-3 max-w-xs">
          <Input type="date" value={pastDate} onChange={(e) => setPastDate(e.target.value)} />
        </div>
        <div className="mt-4">
          {pastLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pastRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance data for this date.</p>
          ) : (
            <div className="space-y-2">
              {pastRows.map((r, idx) => (
                <div key={`${r.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <span className="text-sm font-semibold text-foreground">{r.name}</span>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

