'use client'

import { useState } from 'react'
import { login, signup, resetPassword } from './actions'
import { ArrowRight, Sparkles } from 'lucide-react'

type AuthMode = 'login' | 'signup' | 'reset'

export default function AuthForm({ initialMessage, initialError }: { initialMessage?: string, initialError?: string }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError || '')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true)
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* ── Left Panel ── */}
      <div style={{ width: 480, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '@media (maxWidth: 900px)': { display: 'none' } } as React.CSSProperties}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, background: 'var(--ink)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💼</div>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>JobTrack</span>
        </div>

        {/* Copy */}
        <div>
          <h1 className="serif" style={{ fontSize: 48, lineHeight: 1.1, color: 'var(--ink)', marginBottom: 24, fontWeight: 400 }}>
            Your job hunt,<br /><em style={{ color: 'var(--accent)' }}>finally</em> quiet.
          </h1>
          <div style={{ width: 40, height: 2, background: 'var(--border-2)', marginBottom: 28 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { e: <Sparkles size={14}/>, t: 'Paste any job email — AI extracts everything' },
              { e: <Sparkles size={14}/>, t: 'Track every application in one beautiful place' },
              { e: <Sparkles size={14}/>, t: 'Know your pipeline at a glance, always' },
            ].map(({ e, t }, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', marginTop: 3, flexShrink: 0 }}>{e}</span>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{t}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          In collaboration with SaumyLabs · <a href="https://instagram.com/saumylabs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Follow @saumylabs</a>
        </p>
      </div>

      {/* ── Right Form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 380 }}>
          <h2 className="serif" style={{ fontSize: 36, color: 'var(--ink)', marginBottom: 6, fontWeight: 400 }}>
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create an account' : 'Reset password'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>
            {mode === 'login' ? 'Enter your details to sign in.' : mode === 'signup' ? 'Start tracking your applications for free.' : 'Enter your email to receive a reset link.'}
          </p>

          {initialMessage && (
            <div style={{ background: 'rgba(74,140,92,0.08)', border: '1px solid rgba(74,140,92,0.25)', color: 'var(--s-offer)', fontSize: 13, padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
              {initialMessage}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(160,64,64,0.08)', border: '1px solid rgba(160,64,64,0.25)', color: 'var(--s-rejected)', fontSize: 13, padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form action={mode === 'login' ? login : mode === 'signup' ? signup : resetPassword} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {mode === 'signup' && (
              <div className="fade-in">
                <label className="label">Full Name</label>
                <input name="full_name" type="text" placeholder="John Doe" required className="field" />
              </div>
            )}
            
            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" placeholder="you@example.com" required className="field" />
            </div>
            
            {mode !== 'reset' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('reset')} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <input name="password" type="password" placeholder="••••••••" required minLength={6} className="field" />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', padding: '12px 20px', marginTop: 8, opacity: loading ? 0.7 : 1 }}>
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              {mode === 'login' ? "Don't have an account? " : mode === 'signup' ? "Already have an account? " : "Remembered your password? "}
              <button 
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setLoading(false) }} 
                style={{ background: 'none', border: 'none', color: 'var(--ink)', fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
