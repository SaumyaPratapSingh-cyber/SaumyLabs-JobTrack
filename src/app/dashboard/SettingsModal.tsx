'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { updateProfile } from './actions'
import { UserProfile } from '@/types/job'
import { Settings, X, Save } from 'lucide-react'

export default function SettingsModal({ profile }: { profile: UserProfile | null }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => setMounted(true), [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      const form = new FormData(e.currentTarget)
      const data = {
        full_name: form.get('full_name') as string,
        mobile: form.get('mobile') as string,
        graduation_details: form.get('graduation_details') as string
      }
      await updateProfile(data)
      setSuccess('Profile updated successfully.')
      setTimeout(() => setOpen(false), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = open ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,20,0.3)', backdropFilter: 'blur(3px)' }} />
      
      <div className="card fade-up" style={{ position: 'relative', width: '100%', maxWidth: 420, padding: 28, margin: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="serif" style={{ fontSize: 24, fontWeight: 400, color: 'var(--ink)' }}>Profile Settings</h2>
          <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><X size={18} /></button>
        </div>

        {error && <p style={{ color: 'var(--s-rejected)', fontSize: 13, padding: '10px 14px', background: 'rgba(160,64,64,0.06)', borderRadius: 6, marginBottom: 16 }}>{error}</p>}
        {success && <p style={{ color: 'var(--s-offer)', fontSize: 13, padding: '10px 14px', background: 'rgba(74,140,92,0.08)', borderRadius: 6, marginBottom: 16 }}>{success}</p>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Full Name</label>
            <input name="full_name" defaultValue={profile?.full_name || ''} className="field" placeholder="John Doe" />
          </div>
          <div>
            <label className="label">Mobile Number</label>
            <input name="mobile" defaultValue={profile?.mobile || ''} className="field" placeholder="+1 234 567 890" />
          </div>
          <div>
            <label className="label">Graduation Details</label>
            <input name="graduation_details" defaultValue={profile?.graduation_details || ''} className="field" placeholder="B.Tech Computer Science, 2024" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
              <Save size={14} /> {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost" style={{ padding: '7px 10px' }} aria-label="Settings">
        <Settings size={14} />
      </button>
      {mounted && createPortal(modalContent, document.body)}
    </>
  )
}
