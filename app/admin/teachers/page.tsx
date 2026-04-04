'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Info, Pencil, Search } from 'lucide-react'
import { removeTeacherAssignmentAction, saveTeacherAssignmentAction } from './actions'

type ClassName = 'nursery' | 'lkg' | 'ukg'

type TeacherRow = {
  id: string
  full_name: string | null
  assigned_class: ClassName | null
}

const coral = '#FF6B6B'

function formatClass(value: ClassName | null) {
  if (!value) return '—'
  if (value === 'nursery') return 'Nursery'
  if (value === 'lkg') return 'LKG'
  return 'UKG'
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

function shortId(id: string) {
  return `${id.slice(0, 8)}…`
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState<'all' | ClassName | 'unassigned'>('all')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherRow | null>(null)
  const [assignClass, setAssignClass] = useState<ClassName>('nursery')
  const [saving, setSaving] = useState(false)
  const [unassigning, setUnassigning] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = teachers.filter((t) => {
      const name = (t.full_name ?? '').toLowerCase()
      const matchesQuery = !q || name.includes(q) || t.id.toLowerCase().includes(q)
      const matchesClass =
        classFilter === 'all' ||
        (classFilter === 'unassigned' ? !t.assigned_class : t.assigned_class === classFilter)
      return matchesQuery && matchesClass
    })
    return [...list].sort((a, b) => {
      const aUn = a.assigned_class ? 1 : 0
      const bUn = b.assigned_class ? 1 : 0
      if (aUn !== bUn) return aUn - bUn
      return (a.full_name ?? '').localeCompare(b.full_name ?? '', undefined, { sensitivity: 'base' })
    })
  }, [teachers, query, classFilter])

  const unassignedCount = useMemo(() => teachers.filter((t) => !t.assigned_class).length, [teachers])

  async function loadTeachers() {
    setIsLoading(true)
    const supabase = createClient()

    const [{ data: profiles, error: pErr }, { data: teacherRows, error: tErr }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'teacher'),
      supabase.from('teachers').select('id, assigned_class'),
    ])

    if (pErr) {
      toast.error('Failed to load teacher profiles')
      setIsLoading(false)
      return
    }
    if (tErr) {
      toast.error('Failed to load class assignments')
      setIsLoading(false)
      return
    }

    const rows = (teacherRows ?? []) as { id: string; assigned_class: ClassName | null }[]
    const byId = new Map(rows.map((r) => [r.id, r.assigned_class]))
    const profs = (profiles ?? []) as { id: string; full_name: string | null }[]
    const merged: TeacherRow[] = profs.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      assigned_class: byId.get(p.id) ?? null,
    }))

    setTeachers(merged)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadTeachers()
  }, [])

  function openAssign(t: TeacherRow) {
    setEditing(t)
    setAssignClass(t.assigned_class ?? 'nursery')
    setSheetOpen(true)
  }

  async function saveAssignment() {
    if (!editing) return
    setSaving(true)
    const result = await saveTeacherAssignmentAction(editing.id, assignClass)
    setSaving(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Class assignment saved')
    setSheetOpen(false)
    await loadTeachers()
  }

  async function removeAssignment() {
    if (!editing?.assigned_class) return
    if (!globalThis.confirm('Remove class assignment? This teacher will not be able to mark attendance until assigned again.')) {
      return
    }
    setUnassigning(true)
    const result = await removeTeacherAssignmentAction(editing.id)
    setUnassigning(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Class assignment removed')
    setSheetOpen(false)
    await loadTeachers()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Teachers</h1>
          <p className="text-sm text-muted-foreground">Assign each teacher to Nursery, LKG, or UKG for attendance and diary</p>
        </div>
      </div>

      <Alert className="border-[#E3F4FF] bg-[#E3F4FF]/40">
        <Info className="size-4 text-foreground" />
        <AlertTitle className="text-foreground">Adding new teachers</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Create the account in Supabase Auth, add a row in <span className="font-medium">profiles</span> with{' '}
          <span className="font-medium">role = teacher</span>, then return here to assign their class.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label htmlFor="teacher-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="teacher-search"
              placeholder="Search by name or user id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label>Class</Label>
          <Select value={classFilter} onValueChange={(v) => setClassFilter(v as typeof classFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({teachers.length})</SelectItem>
              <SelectItem value="unassigned">Unassigned ({unassignedCount})</SelectItem>
              <SelectItem value="nursery">Nursery</SelectItem>
              <SelectItem value="lkg">LKG</SelectItem>
              <SelectItem value="ukg">UKG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No teachers match your filters"
          subtitle={teachers.length === 0 ? 'No profiles with role teacher yet.' : 'Try adjusting search or class filter.'}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Assigned class</th>
                  <th className="px-4 py-3 font-semibold text-foreground">User ID</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-4 py-3 font-semibold text-foreground">{t.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {t.assigned_class ? (
                        <span className="text-muted-foreground">{formatClass(t.assigned_class)}</span>
                      ) : (
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100',
                          )}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground" title={t.id}>
                      {shortId(t.id)}
                    </td>
                    <td className="px-4 py-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => openAssign(t)}>
                        <Pencil className="size-4" />
                        {t.assigned_class ? 'Edit' : 'Assign class'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((t) => (
              <div key={t.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{t.full_name ?? '—'}</p>
                    <p className="font-mono text-xs text-muted-foreground" title={t.id}>
                      {shortId(t.id)}
                    </p>
                  </div>
                  {t.assigned_class ? (
                    <span className="shrink-0 text-sm text-muted-foreground">{formatClass(t.assigned_class)}</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                      Unassigned
                    </span>
                  )}
                </div>
                <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => openAssign(t)}>
                  <Pencil className="size-4" />
                  {t.assigned_class ? 'Edit assignment' : 'Assign class'}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <span className="hidden" />
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-xl">{editing?.assigned_class ? 'Edit assignment' : 'Assign class'}</SheetTitle>
            <SheetDescription>
              Class must match the <span className="font-medium">age group</span> of students this teacher manages.
            </SheetDescription>
          </SheetHeader>

          {editing ? (
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-4 overflow-auto px-4 pb-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Teacher</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{editing.full_name ?? '—'}</p>
                  <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{editing.id}</p>
                </div>

                <div className="grid gap-2">
                  <Label>Assigned class</Label>
                  <Select value={assignClass} onValueChange={(v) => setAssignClass(v as ClassName)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nursery">Nursery</SelectItem>
                      <SelectItem value="lkg">LKG</SelectItem>
                      <SelectItem value="ukg">UKG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter className="flex flex-col gap-2 border-t sm:flex-col">
                {editing.assigned_class ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                    disabled={saving || unassigning}
                    onClick={() => void removeAssignment()}
                  >
                    {unassigning ? 'Removing…' : 'Remove class assignment'}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="w-full"
                  disabled={saving || unassigning}
                  style={{ backgroundColor: coral, color: 'white' }}
                  onClick={() => void saveAssignment()}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
