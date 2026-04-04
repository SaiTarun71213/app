'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

type ClassName = 'nursery' | 'lkg' | 'ukg'

export type TeacherMutationResult = { ok: true } | { ok: false; error: string }

async function requireAdminSupabase(): Promise<{ user: { id: string } } | { error: string }> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not signed in.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { error: 'Not authorized.' }
  }

  return { user }
}

export async function saveTeacherAssignmentAction(teacherId: string, assignedClass: ClassName): Promise<TeacherMutationResult> {
  const auth = await requireAdminSupabase()
  if ('error' in auth) return { ok: false, error: auth.error }

  if (!teacherId || !['nursery', 'lkg', 'ukg'].includes(assignedClass)) {
    return { ok: false, error: 'Invalid teacher or class.' }
  }

  let service
  try {
    service = createServiceRoleClient()
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Server configuration error.',
    }
  }

  const { error } = await service
    .from('teachers')
    .upsert({ id: teacherId, assigned_class: assignedClass }, { onConflict: 'id' })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/teachers')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}

export async function removeTeacherAssignmentAction(teacherId: string): Promise<TeacherMutationResult> {
  const auth = await requireAdminSupabase()
  if ('error' in auth) return { ok: false, error: auth.error }

  if (!teacherId) {
    return { ok: false, error: 'Invalid teacher.' }
  }

  let service
  try {
    service = createServiceRoleClient()
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Server configuration error.',
    }
  }

  const { error } = await service.from('teachers').delete().eq('id', teacherId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/teachers')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}
