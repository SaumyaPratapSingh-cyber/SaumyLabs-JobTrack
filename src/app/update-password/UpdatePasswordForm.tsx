'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { updatePasswordAction } from './actions'
import { ArrowRight, Lock } from 'lucide-react'

export default function UpdatePasswordForm() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 440, padding: 40, background: 'var(--surface)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, background: 'var(--surface-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
            <Lock size={15} style={{ color: 'var(--ink)' }} />
          </div>
          <h1 className="serif" style={{ fontSize: 26, color: 'var(--ink)', fontWeight: 400 }}>Update Password</h1>
        </div>

        <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 28 }}>
          Please enter your new password below.
        </p>

        {error && (
          <div style={{ background: 'rgba(160,64,64,0.08)', border: '1px solid rgba(160,64,64,0.25)', color: 'var(--s-rejected)', fontSize: 13, padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form action={updatePasswordAction} onSubmit={() => setLoading(true)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">New Password</label>
            <input name="password" type="password" placeholder="••••••••" required minLength={6} className="field" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', padding: '12px 20px', marginTop: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating...' : 'Update Password'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

      </div>
    </div>
  )
}
