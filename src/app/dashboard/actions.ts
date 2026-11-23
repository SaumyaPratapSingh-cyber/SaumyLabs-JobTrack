'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { JobStatus, UserProfile } from '@/types/job'

function handleDbError(err: any): never {
  const msg = err?.message || String(err)
  if (msg.toLowerCase().includes('fetch failed') || msg.toLowerCase().includes('failed to fetch')) {
    throw new Error('Connection error reaching database. Please check your internet connection and try again.')
  }
  throw new Error(msg)
}

export async function addJobApplication(data: {
  company_name: string; role: string; date_applied?: string; status: JobStatus;
  salary_info?: string; location?: string; job_url?: string; job_id?: string; notes?: string; source_text?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.from('job_applications').insert({ ...data, user_id: user.id })
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
  } catch (err: any) {
    handleDbError(err)
  }
}

export async function updateJobStatus(id: string, status: JobStatus) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('job_applications').update({ status }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
  } catch (err: any) {
    handleDbError(err)
  }
}

export async function updateJobApplication(id: string, data: any) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('job_applications').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
  } catch (err: any) {
    handleDbError(err)
  }
}

export async function deleteJobApplication(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
  } catch (err: any) {
    handleDbError(err)
  }
}

export async function updateProfile(data: Partial<UserProfile>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...data, updated_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
  } catch (err: any) {
    handleDbError(err)
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
  } catch (err: any) {
    handleDbError(err)
  }
}
