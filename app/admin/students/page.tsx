'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Power, Search } from 'lucide-react'

type AgeGroup = 'nursery' | 'lkg' | 'ukg'
type StudentStatus = 'active' | 'inactive'

type StudentRow = {
  id: string
  full_name: string
  date_of_birth: string
  age_group: AgeGroup
  parent_id: string | null
  photo_url: string | null
  address: string | null
  emergency_contact: string | null
  admission_date: string | null
  status: StudentStatus
  created_at: string
  parent_name: string | null
  parent_phone: string | null
  parent_email: string | null
}

const coral = '#FF6B6B'

function formatAgeGroup(value: AgeGroup) {
  if (value === 'nursery') return 'Nursery'
  if (value === 'lkg') return 'LKG'
  return 'UKG'
}

const studentSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  age_group: z.enum(['nursery', 'lkg', 'ukg']),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_phone: z.string().min(8, 'Parent phone is required'),
  parent_email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergency_contact: z.string().optional().or(z.literal('')),
  admission_date: z.string().min(1, 'Admission date is required'),
  status: z.enum(['active', 'inactive']),
})

type StudentFormValues = z.infer<typeof studentSchema>

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [ageFilter, setAgeFilter] = useState<'all' | AgeGroup>('all')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<StudentRow | null>(null)

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: '',
      date_of_birth: '',
      age_group: 'nursery',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      address: '',
      emergency_contact: '',
      admission_date: '',
      status: 'active',
    },
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      const matchesQuery = !q || s.full_name.toLowerCase().includes(q)
      const matchesAge = ageFilter === 'all' || s.age_group === ageFilter
      return matchesQuery && matchesAge
    })
  }, [students, query, ageFilter])

  async function loadStudents() {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select(
        'id,full_name,date_of_birth,age_group,parent_id,photo_url,address,emergency_contact,admission_date,status,created_at,parent_name,parent_phone,parent_email',
      )
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load students')
      setIsLoading(false)
      return
    }

    setStudents((data ?? []) as StudentRow[])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadStudents()
  }, [])

  function openAdd() {
    setEditing(null)
    form.reset({
      full_name: '',
      date_of_birth: '',
      age_group: 'nursery',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      address: '',
      emergency_contact: '',
      admission_date: '',
      status: 'active',
    })
    setSheetOpen(true)
  }

  function openEdit(s: StudentRow) {
    setEditing(s)
    form.reset({
      full_name: s.full_name ?? '',
      date_of_birth: s.date_of_birth ?? '',
      age_group: s.age_group,
      parent_name: s.parent_name ?? '',
      parent_phone: s.parent_phone ?? '',
      parent_email: s.parent_email ?? '',
      address: s.address ?? '',
      emergency_contact: s.emergency_contact ?? '',
      admission_date: s.admission_date ?? '',
      status: s.status,
    })
    setSheetOpen(true)
  }

  async function onSubmit(values: StudentFormValues) {
    const supabase = createClient()

    const payload = {
      full_name: values.full_name.trim(),
      date_of_birth: values.date_of_birth,
      age_group: values.age_group,
      parent_name: values.parent_name.trim(),
      parent_phone: values.parent_phone.trim(),
      parent_email: values.parent_email ? values.parent_email.trim() : null,
      address: values.address ? values.address.trim() : null,
      emergency_contact: values.emergency_contact ? values.emergency_contact.trim() : null,
      admission_date: values.admission_date,
      status: values.status,
    }

    const res = editing
      ? await supabase.from('students').update(payload).eq('id', editing.id).select('id').single()
      : await supabase.from('students').insert(payload).select('id').single()

    if (res.error) {
      toast.error('Failed to save student')
      return
    }

    toast.success('Student saved successfully')
    setSheetOpen(false)
    await loadStudents()
  }

  async function toggleStatus(s: StudentRow) {
    const nextStatus: StudentStatus = s.status === 'active' ? 'inactive' : 'active'
    const supabase = createClient()
    const { error } = await supabase.from('students').update({ status: nextStatus }).eq('id', s.id)

    if (error) {
      toast.error('Failed to update status')
      return
    }

    toast.success(nextStatus === 'active' ? 'Student activated' : 'Student deactivated')
    await loadStudents()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Students</h1>
          <p className="text-sm text-muted-foreground">Manage student profiles and status</p>
        </div>

        <Button
          type="button"
          onClick={openAdd}
          className="w-full sm:w-auto"
          style={{ backgroundColor: coral, color: 'white' }}
        >
          <Plus className="size-4" />
          Add Student
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by student name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label>Age Group</Label>
          <Select value={ageFilter} onValueChange={(v) => setAgeFilter(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
        <EmptyState title="No students found" subtitle="Try adjusting your search or filters." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Age Group</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Parent</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Phone</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Admission Date</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-semibold text-foreground">{s.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatAgeGroup(s.age_group)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.parent_name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.parent_phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          s.status === 'active' ? 'bg-[#E7FFF2] text-foreground' : 'bg-[#FFE3E8] text-foreground',
                        )}
                      >
                        {s.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(s)}>
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => toggleStatus(s)}>
                          <Power className="size-4" />
                          {s.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{s.full_name}</p>
                    <p className="text-sm text-muted-foreground">{formatAgeGroup(s.age_group)}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                      s.status === 'active' ? 'bg-[#E7FFF2]' : 'bg-[#FFE3E8]',
                    )}
                  >
                    {s.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Parent</span>
                    <span className="font-semibold text-foreground">{s.parent_name ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-semibold text-foreground">{s.parent_phone ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Admission</span>
                    <span className="font-semibold text-foreground">
                      {s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => openEdit(s)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => toggleStatus(s)}>
                    <Power className="size-4" />
                    {s.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <span className="hidden" />
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-xl">
              {editing ? 'Edit Student' : 'Add Student'}
            </SheetTitle>
            <SheetDescription>
              {editing ? 'Update student details and save.' : 'Fill the details to create a new student.'}
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex h-full flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="flex-1 space-y-4 overflow-auto px-4 pb-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" {...form.register('full_name')} aria-invalid={!!form.formState.errors.full_name} />
                {form.formState.errors.full_name ? (
                  <p className="text-sm text-red-600">{form.formState.errors.full_name.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" {...form.register('date_of_birth')} aria-invalid={!!form.formState.errors.date_of_birth} />
                {form.formState.errors.date_of_birth ? (
                  <p className="text-sm text-red-600">{form.formState.errors.date_of_birth.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label>Age Group</Label>
                <Select
                  value={form.watch('age_group')}
                  onValueChange={(v) => form.setValue('age_group', v as AgeGroup, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nursery">Nursery</SelectItem>
                    <SelectItem value="lkg">LKG</SelectItem>
                    <SelectItem value="ukg">UKG</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.age_group ? (
                  <p className="text-sm text-red-600">{form.formState.errors.age_group.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parent_name">Parent Name</Label>
                <Input id="parent_name" {...form.register('parent_name')} aria-invalid={!!form.formState.errors.parent_name} />
                {form.formState.errors.parent_name ? (
                  <p className="text-sm text-red-600">{form.formState.errors.parent_name.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parent_phone">Parent Phone</Label>
                <Input id="parent_phone" {...form.register('parent_phone')} aria-invalid={!!form.formState.errors.parent_phone} />
                {form.formState.errors.parent_phone ? (
                  <p className="text-sm text-red-600">{form.formState.errors.parent_phone.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parent_email">Parent Email (optional)</Label>
                <Input id="parent_email" type="email" {...form.register('parent_email')} aria-invalid={!!form.formState.errors.parent_email} />
                {form.formState.errors.parent_email ? (
                  <p className="text-sm text-red-600">{form.formState.errors.parent_email.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input id="address" {...form.register('address')} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emergency_contact">Emergency Contact (optional)</Label>
                <Input id="emergency_contact" {...form.register('emergency_contact')} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="admission_date">Admission Date</Label>
                <Input id="admission_date" type="date" {...form.register('admission_date')} aria-invalid={!!form.formState.errors.admission_date} />
                {form.formState.errors.admission_date ? (
                  <p className="text-sm text-red-600">{form.formState.errors.admission_date.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(v) => form.setValue('status', v as StudentStatus, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SheetFooter className="border-t">
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
                style={{ backgroundColor: coral, color: 'white' }}
              >
                {form.formState.isSubmitting ? 'Saving…' : 'Save Student'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

