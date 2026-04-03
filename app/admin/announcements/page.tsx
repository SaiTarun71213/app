'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2 } from 'lucide-react'

type Target = 'all' | 'nursery' | 'lkg' | 'ukg' | 'teachers'

type AnnouncementRow = {
  id: string
  title: string
  message: string
  target: Target
  created_by: string
  created_at: string
}

const coral = '#FF6B6B'

function targetLabel(value: Target) {
  if (value === 'all') return 'All'
  if (value === 'nursery') return 'Nursery'
  if (value === 'lkg') return 'LKG'
  if (value === 'ukg') return 'UKG'
  return 'Teachers'
}

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<Target>('all')
  const [isPosting, setIsPosting] = useState(false)

  const [rows, setRows] = useState<AnnouncementRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('announcements')
      .select('id,title,message,target,created_by,created_at')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load announcements')
      setIsLoading(false)
      return
    }
    setRows((data ?? []) as AnnouncementRow[])
    setIsLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function post() {
    const t = title.trim()
    const m = message.trim()
    if (!t) {
      toast.error('Title is required')
      return
    }
    if (!m) {
      toast.error('Message is required')
      return
    }

    setIsPosting(true)
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      toast.error('Not logged in')
      setIsPosting(false)
      return
    }

    const { error } = await supabase.from('announcements').insert({
      title: t,
      message: m,
      target,
      created_by: user.id,
    })

    if (error) {
      toast.error('Failed to post announcement')
      setIsPosting(false)
      return
    }

    toast.success('Announcement posted')
    setTitle('')
    setMessage('')
    setTarget('all')
    setIsPosting(false)
    await load()
  }

  async function del(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete announcement')
      return
    }
    toast.success('Announcement deleted')
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Announcements</h1>
        <p className="text-sm text-muted-foreground">Post updates for parents and teachers</p>
      </div>

      <section className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">Create announcement</h2>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              className="min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Target</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="nursery">Nursery</SelectItem>
                <SelectItem value="lkg">LKG</SelectItem>
                <SelectItem value="ukg">UKG</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={post}
              disabled={isPosting}
              className="w-full"
              style={{ backgroundColor: coral, color: 'white' }}
            >
              {isPosting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">All announcements</h2>
        </div>
        <div className="p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((a) => (
                <div key={a.id} className="rounded-xl bg-muted/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{a.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-background px-3 py-1 font-semibold text-foreground">
                          {targetLabel(a.target)}
                        </span>
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={() => del(a.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

