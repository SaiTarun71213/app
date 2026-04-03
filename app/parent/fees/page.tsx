'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type AgeGroup = 'nursery' | 'lkg' | 'ukg'

type Child = {
  id: string
  age_group: AgeGroup
}

type FeeRow = {
  id: string
  month: number
  year: number
  amount: number | string
  status: 'paid' | 'unpaid' | 'partial'
  payment_date: string | null
  payment_mode: 'cash' | 'upi' | 'bank_transfer' | null
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function monthLabel(m: number) {
  return monthNames[m - 1] ?? `Month ${m}`
}

function statusBadge(status: FeeRow['status']) {
  if (status === 'paid') return { label: 'Paid', className: 'bg-[#E7FFF2] text-foreground' }
  if (status === 'unpaid') return { label: 'Unpaid', className: 'bg-[#FFE3E8] text-foreground' }
  return { label: 'Partial', className: 'bg-[#FFF6D9] text-foreground' }
}

function formatAmount(a: number | string) {
  const num = typeof a === 'string' ? Number(a) : a
  if (!Number.isFinite(num)) return '0'
  return num.toFixed(0)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString()
}

export default function ParentFeesPage() {
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<Child | null>(null)
  const [fees, setFees] = useState<FeeRow[]>([])

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
        setFees([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('fees')
        .select('id,month,year,amount,status,payment_date,payment_mode')
        .eq('student_id', childData.id)
        .eq('year', currentYear)

      if (ignore) return
      setFees((data ?? []) as FeeRow[])
      setLoading(false)
    }

    void load()
    return () => {
      ignore = true
    }
  }, [currentYear])

  const totals = useMemo(() => {
    let paid = 0
    let pending = 0
    for (const f of fees) {
      const amt = typeof f.amount === 'string' ? Number(f.amount) : f.amount
      if (!Number.isFinite(amt)) continue
      if (f.status === 'paid') paid += amt
      if (f.status === 'unpaid' || f.status === 'partial') pending += amt
    }
    return { paid, pending }
  }, [fees])

  const sortedFees = useMemo(() => {
    return [...fees].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      return b.month - a.month
    })
  }, [fees])

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

  if (fees.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          No fee records found. Please contact the school.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Fee Status</h1>
        <p className="mt-1 text-sm text-muted-foreground">Year: {currentYear}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#E7FFF2] p-5">
          <p className="text-sm font-semibold text-muted-foreground">Total Paid This Year</p>
          <p className="mt-2 text-3xl font-bold text-foreground">₹{formatAmount(totals.paid)}</p>
        </div>
        <div className="rounded-2xl bg-[#FFE3E8] p-5">
          <p className="text-sm font-semibold text-muted-foreground">Total Pending</p>
          <p className="mt-2 text-3xl font-bold text-foreground">₹{formatAmount(totals.pending)}</p>
        </div>
      </div>

      <section className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">Fee Records</h2>
          <p className="text-sm text-muted-foreground">Newest first</p>
        </div>
        <div className="divide-y p-5">
          {sortedFees.map((f) => {
            const b = statusBadge(f.status)
            return (
              <div key={f.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {monthLabel(f.month)} {f.year}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Amount: ₹{formatAmount(f.amount)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Payment Date: {formatDate(f.payment_date)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mode: {f.payment_mode ?? '—'}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', b.className)}>
                    {b.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

