'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Save } from 'lucide-react'

type EnquiryStatus = 'new' | 'contacted' | 'admitted' | 'not_interested'

type EnquiryRow = {
  id: string
  parent_name: string
  phone: string
  email: string | null
  child_name: string
  child_dob: string
  age_group: string
  message: string | null
  status: EnquiryStatus
  notes: string | null
  created_at: string
}

const statusLabel: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  admitted: 'Admitted',
  not_interested: 'Not Interested',
}

function statusBadgeClass(status: EnquiryStatus) {
  if (status === 'new') return 'bg-[#E3F4FF] text-foreground'
  if (status === 'contacted') return 'bg-[#FFF6D9] text-foreground'
  if (status === 'admitted') return 'bg-[#E7FFF2] text-foreground'
  return 'bg-[#FFE3E8] text-foreground'
}

export default function AdminEnquiriesPage() {
  const [rows, setRows] = useState<EnquiryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, { status: EnquiryStatus; notes: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  async function load() {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('enquiries')
      .select('id,parent_name,phone,email,child_name,child_dob,age_group,message,status,notes,created_at')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load enquiries')
      setIsLoading(false)
      return
    }

    const list = (data ?? []) as EnquiryRow[]
    setRows(list)
    setDraft(
      Object.fromEntries(
        list.map((e) => [
          e.id,
          { status: e.status, notes: e.notes ?? '' },
        ]),
      ),
    )
    setIsLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      return (
        r.parent_name.toLowerCase().includes(q) ||
        r.child_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      )
    })
  }, [rows, query])

  async function save(id: string) {
    const d = draft[id]
    if (!d) return
    setSavingId(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('enquiries')
      .update({ status: d.status, notes: d.notes ? d.notes : null })
      .eq('id', id)

    if (error) {
      toast.error('Failed to save enquiry')
      setSavingId(null)
      return
    }

    toast.success('Enquiry updated')
    setSavingId(null)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Enquiries</h1>
          <p className="text-sm text-muted-foreground">Track and update admission enquiries</p>
        </div>
      </div>

      <div className="max-w-xl">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search by parent, child, or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-base font-semibold text-foreground">No enquiries found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const isExpanded = expandedId === e.id
            const d = draft[e.id] ?? { status: e.status, notes: e.notes ?? '' }
            return (
              <div key={e.id} className="rounded-2xl border bg-card">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{e.parent_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.child_name} • {e.age_group} • {new Date(e.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusBadgeClass(d.status))}>
                      {statusLabel[d.status]}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-t p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-semibold text-foreground">{e.phone}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground">{e.email ?? '—'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Child DOB</p>
                        <p className="font-semibold text-foreground">{new Date(e.child_dob).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Message</p>
                        <p className="font-semibold text-foreground">{e.message ?? '—'}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                          value={d.status}
                          onValueChange={(v) =>
                            setDraft((prev) => ({
                              ...prev,
                              [e.id]: { ...d, status: v as EnquiryStatus },
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="admitted">Admitted</SelectItem>
                            <SelectItem value="not_interested">Not Interested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Notes</Label>
                        <textarea
                          className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                          value={d.notes}
                          onChange={(ev) =>
                            setDraft((prev) => ({
                              ...prev,
                              [e.id]: { ...d, notes: ev.target.value },
                            }))
                          }
                          placeholder="Add notes…"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Button type="button" onClick={() => save(e.id)} disabled={savingId === e.id}>
                        <Save className="size-4" />
                        {savingId === e.id ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

