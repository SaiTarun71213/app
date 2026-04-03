'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AgeGroup = 'nursery' | 'lkg' | 'ukg'

type Child = {
  id: string
  full_name: string
  age_group: AgeGroup
}

type DiaryRow = {
  id: string
  date: string
  content: string
  class: AgeGroup
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function classLabel(c: AgeGroup) {
  if (c === 'nursery') return 'Nursery'
  if (c === 'lkg') return 'LKG'
  return 'UKG'
}

function monthLabel(index1Based: number) {
  const d = new Date(2000, index1Based - 1, 1)
  return d.toLocaleString(undefined, { month: 'long' })
}

function formatDiaryDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ParentDiaryPage() {
  const today = useMemo(() => new Date(), [])
  const [month, setMonth] = useState<number>(today.getMonth() + 1)
  const [year, setYear] = useState<number>(today.getFullYear())

  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<Child | null>(null)
  const [entries, setEntries] = useState<DiaryRow[]>([])

  const { startIso, endIso } = useMemo(() => {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    return { startIso: toDateInputValue(start), endIso: toDateInputValue(end) }
  }, [month, year])

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
        .select('id,full_name,age_group')
        .eq('parent_id', user.id)
        .eq('status', 'active')
        .single<Child>()

      if (ignore) return
      setChild(childData ?? null)

      if (!childData) {
        setEntries([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('diary_entries')
        .select('id,class,date,content')
        .eq('class', childData.age_group)
        .gte('date', startIso)
        .lte('date', endIso)
        .order('date', { ascending: false })

      if (ignore) return
      setEntries((data ?? []) as DiaryRow[])
      setLoading(false)
    }

    void load()
    return () => {
      ignore = true
    }
  }, [startIso, endIso])

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
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Daily Diary</h1>
        <p className="mt-1 text-sm text-muted-foreground">Class: {classLabel(child.age_group)}</p>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:w-56">
            <Label>Month</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => {
                  const m = i + 1
                  return (
                    <SelectItem key={m} value={String(m)}>
                      {monthLabel(m)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 sm:w-40">
            <Label>Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2100}
            />
          </div>
        </div>

        <div className="mt-3 text-sm text-muted-foreground">
          Showing entries for {monthLabel(month)} {year}
        </div>
      </section>

      {entries.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No diary entries for this month
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{formatDiaryDate(entry.date)}</p>
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{entry.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

