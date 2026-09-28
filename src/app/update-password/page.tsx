import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import UpdatePasswordForm from './UpdatePasswordForm'

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Must be logged in to update password
  if (!user) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <UpdatePasswordForm />
    </Suspense>
  )
}
