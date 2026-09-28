'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const fullName = formData.get('full_name') as string

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // Create initial profile if successful and user is created
  if (authData.user && fullName) {
    await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      updated_at: new Date().toISOString()
    })
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check email to continue sign in process')
}
