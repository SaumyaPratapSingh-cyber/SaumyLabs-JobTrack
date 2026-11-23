'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function formatAuthError(msg?: string): string {
  if (!msg) return 'An error occurred during authentication.'
  const lower = msg.toLowerCase()
  if (lower.includes('fetch failed') || lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Unable to connect to authentication service. Please check your internet connection and try again.'
  }
  return msg
}

export async function login(formData: FormData) {
  let supabase
  try {
    supabase = await createClient()
  } catch (err: any) {
    redirect('/login?error=' + encodeURIComponent(formatAuthError(err?.message)))
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  let authError: any = null
  try {
    const { error } = await supabase.auth.signInWithPassword(data)
    authError = error
  } catch (err: any) {
    authError = err
  }

  if (authError) {
    if (authError?.digest?.startsWith('NEXT_REDIRECT') || authError?.message === 'NEXT_REDIRECT') {
      throw authError
    }
    redirect('/login?error=' + encodeURIComponent(formatAuthError(authError.message)))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  let supabase
  try {
    supabase = await createClient()
  } catch (err: any) {
    redirect('/login?error=' + encodeURIComponent(formatAuthError(err?.message)))
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const fullName = formData.get('full_name') as string

  let authResult: any = null
  try {
    authResult = await supabase.auth.signUp(data)
  } catch (err: any) {
    authResult = { error: err }
  }

  const { data: authData, error } = authResult

  if (error) {
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error
    }
    redirect('/login?error=' + encodeURIComponent(formatAuthError(error.message)))
  }

  // Create initial profile if successful and user is created
  if (authData?.user && fullName) {
    try {
      await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
    } catch {
      // Non-fatal
    }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check email to continue sign in process')
}

export async function resetPassword(formData: FormData) {
  let supabase
  try {
    supabase = await createClient()
  } catch (err: any) {
    redirect('/login?error=' + encodeURIComponent(formatAuthError(err?.message)))
  }
  const email = formData.get('email') as string
  
  let origin = 'http://localhost:3000'
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    
    // Check x-forwarded-host first (Vercel), then host
    const host = headersList.get('x-forwarded-host') || headersList.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    if (host) {
      origin = `${protocol}://${host}`
    }
  } catch (e) {
    // ignore
  }

  let resetErr: any = null
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/update-password`,
    })
    resetErr = error
  } catch (err: any) {
    resetErr = err
  }

  if (resetErr) {
    if (resetErr?.digest?.startsWith('NEXT_REDIRECT') || resetErr?.message === 'NEXT_REDIRECT') {
      throw resetErr
    }
    redirect('/login?error=' + encodeURIComponent(formatAuthError(resetErr.message)))
  }

  redirect('/login?message=Check your email for the password reset link')
}
