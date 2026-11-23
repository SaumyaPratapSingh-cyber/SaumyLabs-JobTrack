'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePasswordAction(formData: FormData) {
  let supabase
  try {
    supabase = await createClient()
  } catch (err: any) {
    redirect('/update-password?error=' + encodeURIComponent('Unable to connect to authentication service. Please try again.'))
  }
  const password = formData.get('password') as string

  let authErr: any = null
  try {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    authErr = error
  } catch (err: any) {
    authErr = err
  }

  if (authErr) {
    const msg = authErr.message?.toLowerCase().includes('fetch failed')
      ? 'Unable to connect to authentication service. Please check your internet connection and try again.'
      : authErr.message
    redirect('/update-password?error=' + encodeURIComponent(msg))
  }

  // Password updated successfully, redirect to dashboard
  redirect('/dashboard')
}
