import { Suspense } from 'react'
import AuthForm from './AuthForm'

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm initialMessage={searchParams?.message} initialError={searchParams?.error} />
    </Suspense>
  )
}
