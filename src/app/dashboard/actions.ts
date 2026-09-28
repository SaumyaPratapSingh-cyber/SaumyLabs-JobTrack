'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { JobStatus, UserProfile } from '@/types/job'

export async function addJobApplication(data: {
  company_name: string; role: string; date_applied?: string; status: JobStatus;
  salary_info?: string; location?: string; job_url?: string; job_id?: string; notes?: string; source_text?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('job_applications').insert({ ...data, user_id: user.id })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const supabase = await createClient()
  const { error } = await supabase.from('job_applications').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function updateJobApplication(id: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('job_applications').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function deleteJobApplication(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('job_applications').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function updateProfile(data: Partial<UserProfile>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('profiles').upsert({ id: user.id, ...data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
