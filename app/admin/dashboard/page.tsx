'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type DashboardCounts = {
  totalStudents: number
  totalTeachers: number
  pendingEnquiries: number
  feeDefaulters: number
}

type EnquiryRow = {
  id: string
  parent_name: string
  phone: string
  child_name: string
  age_group: string
  status: 'new' | 'contacted' | 'admitted' | 'not_interested'
  created_at: string
}

type StudentRow = {
  id: string
  full_name: string
  age_group: 'nursery' | 'lkg' | 'ukg'
  admission_date: string | null
  status: 'active' | 'inactive'
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'yellow' | 'blue' | 'pink' | 'green' }) {
  const toneClass =
    tone === 'yellow'
      ? 'bg-[#FFF6D9]'
      : tone === 'blue'
        ? 'bg-[#E3F4FF]'
        : tone === 'pink'
          ? 'bg-[#FFE3E8]'
          : 'bg-[#E7FFF2]'

  return (
    <div className={cn('rounded-2xl p-5 shadow-sm', toneClass)}>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function formatAgeGroup(value: string) {
  if (value === 'nursery') return 'Nursery'
  if (value === 'lkg') return 'LKG'
  if (value === 'ukg') return 'UKG'
  return value
}

function formatEnquiryStatus(value: EnquiryRow['status']) {
  if (value === 'new') return 'New'
  if (value === 'contacted') return 'Contacted'
  if (value === 'admitted') return 'Admitted'
  return 'Not Interested'
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null)
  const [recentEnquiries, setRecentEnquiries] = useState<EnquiryRow[]>([])
  const [recentStudents, setRecentStudents] = useState<StudentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const currentMonthYear = useMemo(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  }, [])

  useEffect(() => {
    let ignore = false

    async function load() {
      setIsLoading(true)
      const supabase = createClient()

      const [{ count: activeStudentsCount }, { count: teachersCount }, { count: pendingEnquiriesCount }] =
        await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('teachers').select('id', { count: 'exact', head: true }),
          supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        ])

      const { data: unpaidFeeRows } = await supabase
        .from('fees')
        .select('student_id')
        .eq('status', 'unpaid')
        .eq('month', currentMonthYear.month)
        .eq('year', currentMonthYear.year)

      const defaulterCount = new Set((unpaidFeeRows ?? []).map((r) => r.student_id)).size

      const [{ data: enquiries }, { data: students }] = await Promise.all([
        supabase
          .from('enquiries')
          .select('id,parent_name,phone,child_name,age_group,status,created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('students')
          .select('id,full_name,age_group,admission_date,status')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      if (ignore) return
      setCounts({
        totalStudents: activeStudentsCount ?? 0,
        totalTeachers: teachersCount ?? 0,
        pendingEnquiries: pendingEnquiriesCount ?? 0,
        feeDefaulters: defaulterCount,
      })
      setRecentEnquiries((enquiries ?? []) as EnquiryRow[])
      setRecentStudents((students ?? []) as StudentRow[])
      setIsLoading(false)
    }

    void load()
    return () => {
      ignore = true
    }
  }, [currentMonthYear.month, currentMonthYear.year])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {currentMonthYear.month}/{currentMonthYear.year}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students (Active)" value={counts?.totalStudents ?? 0} tone="yellow" />
        <StatCard label="Total Teachers" value={counts?.totalTeachers ?? 0} tone="blue" />
        <StatCard label="Pending Enquiries" value={counts?.pendingEnquiries ?? 0} tone="pink" />
        <StatCard label="Fee Defaulters (This Month)" value={counts?.feeDefaulters ?? 0} tone="green" />
      </div>

      {/* Recent tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-bold text-foreground">Recent Enquiries</h2>
            <p className="text-sm text-muted-foreground">Latest 5 admission enquiries</p>
          </div>
          <div className="p-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recentEnquiries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enquiries yet.</p>
            ) : (
              <div className="space-y-3">
                {recentEnquiries.map((e) => (
                  <div key={e.id} className="rounded-xl bg-muted/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{e.parent_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {e.child_name} • {formatAgeGroup(e.age_group)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                        {formatEnquiryStatus(e.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{e.phone}</span>
                      <span>{new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-bold text-foreground">Recent Students</h2>
            <p className="text-sm text-muted-foreground">Latest 5 admissions</p>
          </div>
          <div className="p-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students yet.</p>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((s) => (
                  <div key={s.id} className="rounded-xl bg-muted/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{s.full_name}</p>
                        <p className="text-sm text-muted-foreground">{formatAgeGroup(s.age_group)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                        {s.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Admission</span>
                      <span>{s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
