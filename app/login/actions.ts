'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = {
  error?: string
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email and password are required.' }

  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: 'Invalid email or password.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  const role = profile?.role as 'admin' | 'teacher' | 'parent' | undefined

  if (role === 'admin') redirect('/admin/dashboard')
  if (role === 'teacher') redirect('/teacher/dashboard')
  if (role === 'parent') redirect('/parent/dashboard')

  // If the user can authenticate but doesn't have a usable profile/role, block access.
  await supabase.auth.signOut()
  return { error: 'Your account is not set up yet. Please contact the admin.' }
}

