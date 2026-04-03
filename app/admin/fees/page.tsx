'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'

type AgeGroup = 'nursery' | 'lkg' | 'ukg'
type FeeStatus = 'paid' | 'unpaid' | 'partial'
type PaymentMode = 'cash' | 'upi' | 'bank_transfer'

type StudentLite = {
  id: string
  full_name: string
  age_group: AgeGroup
  parent_phone: string | null
  status: 'active' | 'inactive'
}

type FeeRow = {
  id: string
  student_id: string
  month: number
  year: number
  amount: number
  status: FeeStatus
  payment_date: string | null
  payment_mode: PaymentMode | null
  receipt_number: string | null
  notes: string | null
  created_at: string
}

const coral = '#FF6B6B'

function monthLabel(m: number) {
  const d = new Date(2000, m - 1, 1)
  return d.toLocaleString(undefined, { month: 'short' })
}

function formatAgeGroup(value: AgeGroup) {
  if (value === 'nursery') return 'Nursery'
  if (value === 'lkg') return 'LKG'
  return 'UKG'
}

export default function AdminFeesPage() {
  const now = useMemo(() => new Date(), [])
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [students, setStudents] = useState<StudentLite[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  const [month, setMonth] = useState<number>(currentMonth)
  const [year, setYear] = useState<number>(currentYear)

  const [fees, setFees] = useState<FeeRow[]>([])
  const [feesLoading, setFeesLoading] = useState(false)

  const [defaulters, setDefaulters] = useState<{ student: StudentLite; amountDue: number }[]>([])
  const [defaultersLoading, setDefaultersLoading] = useState(false)

  const [tab, setTab] = useState<'records' | 'defaulters'>('records')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    month: currentMonth,
    year: currentYear,
    amount: '',
    status: 'unpaid' as FeeStatus,
    payment_date: '',
    payment_mode: 'cash' as PaymentMode,
    receipt_number: '',
    notes: '',
  })

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  )

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => s.full_name.toLowerCase().includes(q))
  }, [students, studentQuery])

  async function loadStudents() {
    setStudentsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select('id,full_name,age_group,parent_phone,status')
      .order('full_name', { ascending: true })

    if (error) {
      toast.error('Failed to load students')
      setStudentsLoading(false)
      return
    }
    setStudents((data ?? []) as StudentLite[])
    setStudentsLoading(false)
  }

  async function loadFees() {
    if (!selectedStudentId) {
      setFees([])
      return
    }
    setFeesLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('fees')
      .select('id,student_id,month,year,amount,status,payment_date,payment_mode,receipt_number,notes,created_at')
      .eq('student_id', selectedStudentId)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load fee records')
      setFeesLoading(false)
      return
    }
    setFees((data ?? []) as FeeRow[])
    setFeesLoading(false)
  }

  async function loadDefaulters() {
    setDefaultersLoading(true)
    const supabase = createClient()
    const { data: unpaidFees, error } = await supabase
      .from('fees')
      .select('student_id,amount')
      .eq('status', 'unpaid')
      .eq('month', currentMonth)
      .eq('year', currentYear)

    if (error) {
      toast.error('Failed to load defaulters')
      setDefaultersLoading(false)
      return
    }

    const ids = Array.from(new Set((unpaidFees ?? []).map((r) => r.student_id)))
    if (ids.length === 0) {
      setDefaulters([])
      setDefaultersLoading(false)
      return
    }

    const { data: defStudents, error: sErr } = await supabase
      .from('students')
      .select('id,full_name,age_group,parent_phone,status')
      .in('id', ids)

    if (sErr) {
      toast.error('Failed to load defaulters')
      setDefaultersLoading(false)
      return
    }

    const byId = new Map((defStudents ?? []).map((s) => [s.id, s as StudentLite]))
    const amountById = new Map<string, number>()
    for (const r of unpaidFees ?? []) {
      amountById.set(r.student_id, (amountById.get(r.student_id) ?? 0) + Number(r.amount ?? 0))
    }

    const list = ids
      .map((id) => {
        const student = byId.get(id)
        if (!student) return null
        return { student, amountDue: amountById.get(id) ?? 0 }
      })
      .filter(Boolean) as { student: StudentLite; amountDue: number }[]

    setDefaulters(list)
    setDefaultersLoading(false)
  }

  useEffect(() => {
    void loadStudents()
  }, [])

  useEffect(() => {
    void loadFees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId, month, year])

  function openAddFee() {
    if (!selectedStudentId) {
      toast.error('Select a student first')
      return
    }
    setForm({
      student_id: selectedStudentId,
      month,
      year,
      amount: '',
      status: 'unpaid',
      payment_date: '',
      payment_mode: 'cash',
      receipt_number: '',
      notes: '',
    })
    setSheetOpen(true)
  }

  async function saveFee() {
    if (!form.student_id) return
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (!form.month || !form.year) {
      toast.error('Month and year are required')
      return
    }

    const payload = {
      student_id: form.student_id,
      month: form.month,
      year: form.year,
      amount,
      status: form.status,
      payment_date: form.status === 'paid' ? (form.payment_date || null) : null,
      payment_mode: form.status === 'paid' || form.status === 'partial' ? form.payment_mode : null,
      receipt_number: form.receipt_number ? form.receipt_number.trim() : null,
      notes: form.notes ? form.notes.trim() : null,
    }

    const supabase = createClient()
    const { error } = await supabase.from('fees').insert(payload)

    if (error) {
      toast.error('Failed to save fee record')
      return
    }

    toast.success('Fee record saved')
    setSheetOpen(false)
    await loadFees()
    if (tab === 'defaulters') await loadDefaulters()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Fees</h1>
          <p className="text-sm text-muted-foreground">Track fee payments (manual)</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setTab('records')
          }}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-semibold',
            tab === 'records' ? 'bg-muted text-foreground' : 'text-muted-foreground',
          )}
        >
          Fee Records
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('defaulters')
            void loadDefaulters()
          }}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-semibold',
            tab === 'defaulters' ? 'bg-muted text-foreground' : 'text-muted-foreground',
          )}
        >
          Fee Defaulters
        </button>
      </div>

      {tab === 'records' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Label>Student</Label>
              <div className="mt-2 rounded-2xl border bg-card p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search student"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="mt-3 max-h-56 overflow-auto rounded-xl border">
                  {studentsLoading ? (
                    <p className="p-3 text-sm text-muted-foreground">Loading…</p>
                  ) : filteredStudents.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No students found</p>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = s.id === selectedStudentId
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStudentId(s.id)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm',
                            isSelected ? 'bg-muted' : 'hover:bg-muted/40',
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground">{formatAgeGroup(s.age_group)}</p>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">{s.status}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Month</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const m = idx + 1
                      return (
                        <SelectItem key={m} value={String(m)}>
                          {monthLabel(m)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  className="mt-2"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={2000}
                  max={2100}
                />
              </div>

              <Button
                type="button"
                onClick={openAddFee}
                className="w-full"
                style={{ backgroundColor: coral, color: 'white' }}
                disabled={!selectedStudentId}
              >
                <Plus className="size-4" />
                Add Fee Record
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">Fee Records</h2>
              <p className="text-sm text-muted-foreground">
                {selectedStudent ? `${selectedStudent.full_name} • ${monthLabel(month)} ${year}` : 'Select a student'}
              </p>
            </div>
            <div className="p-5">
              {!selectedStudentId ? (
                <p className="text-sm text-muted-foreground">Select a student to view fee records.</p>
              ) : feesLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : fees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fee records found.</p>
              ) : (
                <div className="space-y-3">
                  {fees.map((f) => (
                    <div key={f.id} className="rounded-xl bg-muted/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {monthLabel(f.month)} {f.year} • ₹{Number(f.amount).toFixed(0)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {f.status.toUpperCase()}
                            {f.payment_date ? ` • Paid on ${new Date(f.payment_date).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                          {f.payment_mode ?? '—'}
                        </span>
                      </div>
                      {f.receipt_number ? (
                        <p className="mt-2 text-xs text-muted-foreground">Receipt: {f.receipt_number}</p>
                      ) : null}
                      {f.notes ? <p className="mt-2 text-xs text-muted-foreground">{f.notes}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right" className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="text-xl">Add Fee Record</SheetTitle>
                <SheetDescription>Record payment status for a student.</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-4">
                <div className="grid gap-2">
                  <Label>Student</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Month</Label>
                    <Select value={String(form.month)} onValueChange={(v) => setForm((p) => ({ ...p, month: Number(v) }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const m = idx + 1
                          return (
                            <SelectItem key={m} value={String(m)}>
                              {monthLabel(m)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={form.year}
                      onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
                      min={2000}
                      max={2100}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Amount</Label>
                  <Input value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as FeeStatus }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(form.status === 'paid' || form.status === 'partial') ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Payment Date</Label>
                      <Input
                        type="date"
                        value={form.payment_date}
                        onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mode</Label>
                      <Select
                        value={form.payment_mode}
                        onValueChange={(v) => setForm((p) => ({ ...p, payment_mode: v as PaymentMode }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label>Receipt No (optional)</Label>
                  <Input
                    value={form.receipt_number}
                    onChange={(e) => setForm((p) => ({ ...p, receipt_number: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Notes (optional)</Label>
                  <textarea
                    className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <SheetFooter className="border-t">
                <Button type="button" className="w-full" onClick={saveFee} style={{ backgroundColor: coral, color: 'white' }}>
                  Save Fee Record
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <div className="rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-bold text-foreground">Fee Defaulters</h2>
            <p className="text-sm text-muted-foreground">
              Students with unpaid fees for {monthLabel(currentMonth)} {currentYear}
            </p>
          </div>
          <div className="p-5">
            {defaultersLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : defaulters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No defaulters for this month.</p>
            ) : (
              <div className="space-y-3">
                {defaulters.map(({ student, amountDue }) => (
                  <div key={student.id} className="rounded-xl bg-muted/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatAgeGroup(student.age_group)} • {student.parent_phone ?? '—'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                        ₹{amountDue.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

