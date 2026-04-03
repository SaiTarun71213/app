'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ClassName = 'nursery' | 'lkg' | 'ukg'

type DiaryEntry = {
  id: string
  class: ClassName
  date: string
  content: string
  created_by: string
  created_at: string
}

function classLabel(c: ClassName) {
  if (c === 'nursery') return 'Nursery'
  if (c === 'lkg') return 'LKG'
  return 'UKG'
}

export default function TeacherDiaryPage() {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [assignedClass, setAssignedClass] = useState<ClassName | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [missingClass, setMissingClass] = useState(false)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

    setAssignedClass(teacher.assigned_class)
    setMissingClass(false)
    setLoading(false)
  }

  async function loadDiaryForDate() {
    if (!assignedClass) return
    const supabase = createClient()
    const { data } = await supabase
      .from('diary_entries')
      .select('id,class,date,content,created_by,created_at')
      .eq('class', assignedClass)
      .eq('date', selectedDate)
      .limit(1)
    setContent(data?.[0]?.content ?? '')
  }

  async function loadPastEntries() {
    if (!assignedClass) return
    const supabase = createClient()
    const { data } = await supabase
      .from('diary_entries')
      .select('id,class,date,content,created_by,created_at')
      .eq('class', assignedClass)
      .order('date', { ascending: false })
      .limit(10)
    setEntries((data ?? []) as DiaryEntry[])
  }

  useEffect(() => {
    void loadBase()
  }, [])

  useEffect(() => {
    if (!assignedClass) return
    void loadDiaryForDate()
  }, [assignedClass, selectedDate])

  useEffect(() => {
    if (!assignedClass) return
    void loadPastEntries()
  }, [assignedClass])

  async function save() {
    if (!assignedClass || !userId) return
    if (!content.trim()) {
      toast.error('Diary content is required')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('diary_entries').upsert(
      {
        class: assignedClass,
        date: selectedDate,
        content: content.trim(),
        created_by: userId,
      },
      { onConflict: 'class,date' },
    )
    if (error) {
      toast.error('Failed to save diary')
      setSaving(false)
      return
    }
    toast.success('Diary saved successfully')
    setSaving(false)
    await loadPastEntries()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (missingClass) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Daily Diary</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have not been assigned a class yet. Please contact admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Daily Diary</h1>
        <p className="text-sm text-muted-foreground">
          Class: {assignedClass ? classLabel(assignedClass) : ''}
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <div className="max-w-xs">
          <label className="mb-2 block text-sm font-semibold text-foreground">Date</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>

        <div className="mt-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did the class do today? Activities, topics covered, special moments..."
            className="min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          <p className="mt-1 text-xs text-muted-foreground">{content.length} characters</p>
        </div>

        <Button
          type="button"
          className="mt-4 h-11 w-full sm:w-auto"
          style={{ backgroundColor: '#FF6B6B', color: 'white' }}
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Diary Entry'}
        </Button>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground">Recent Entries</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No diary entries yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {entries.map((entry) => {
              const expanded = expandedId === entry.id
              return (
                <div key={entry.id} className="rounded-xl bg-muted/40 p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className="w-full text-left"
                  >
                    <p className="font-semibold text-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {expanded ? entry.content : `${entry.content.slice(0, 100)}${entry.content.length > 100 ? '…' : ''}`}
                    </p>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

