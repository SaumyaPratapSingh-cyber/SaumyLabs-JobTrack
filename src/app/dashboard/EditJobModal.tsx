'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { JobApplication, JobStatus } from '@/types/job'
import { X, Save, ExternalLink } from 'lucide-react'

export default function EditJobModal({ job, onClose }: { job: JobApplication; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<Partial<JobApplication>>(job)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setMounted(true), [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('job_applications')
        .update({
          company_name: data.company_name,
          role: data.role,
          job_id: data.job_id || null,
          date_applied: data.date_applied || null,
          status: data.status,
          salary_info: data.salary_info || null,
          location: data.location || null,
          job_url: data.job_url || null,
          notes: data.notes || null,
        })
        .eq('id', job.id)

      if (dbError) throw new Error(dbError.message)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to update. Please try again.')
      setLoading(false)
    }
  }

  const modalContent = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,20,0.3)', backdropFilter: 'blur(3px)' }} />
      
      <div className="card fade-up" style={{ position: 'relative', width: '100%', maxWidth: 540, padding: 28, margin: 16, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 400, color: 'var(--ink)' }}>Edit Application</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{job.company_name} — {job.role}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><X size={18} /></button>
        </div>

        {error && <p style={{ color: 'var(--s-rejected)', fontSize: 13, padding: '10px 14px', background: 'rgba(160,64,64,0.06)', borderRadius: 6, marginBottom: 16 }}>{error}</p>}

        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label">Company Name</label>
            <input value={data.company_name || ''} onChange={e => setData(d => ({ ...d, company_name: e.target.value }))} className="field" required />
          </div>
          <div>
            <label className="label">Role</label>
            <input value={data.role || ''} onChange={e => setData(d => ({ ...d, role: e.target.value }))} className="field" required />
          </div>
          <div>
            <label className="label">Job ID</label>
            <input value={data.job_id || ''} onChange={e => setData(d => ({ ...d, job_id: e.target.value }))} className="field" placeholder="e.g. REQ-12345" />
          </div>
          <div>
            <label className="label">Date Applied</label>
            <input type="date" value={data.date_applied || ''} onChange={e => setData(d => ({ ...d, date_applied: e.target.value }))} className="field" />
          </div>
          <div>
            <label className="label">Location</label>
            <input value={data.location || ''} onChange={e => setData(d => ({ ...d, location: e.target.value }))} className="field" />
          </div>
          <div>
            <label className="label">Salary</label>
            <input value={data.salary_info || ''} onChange={e => setData(d => ({ ...d, salary_info: e.target.value }))} className="field" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Status</label>
            <select value={data.status || 'Applied'} onChange={e => setData(d => ({ ...d, status: e.target.value as JobStatus }))} className="field">
              {['Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Job URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={data.job_url || ''} onChange={e => setData(d => ({ ...d, job_url: e.target.value }))} className="field" style={{ flex: 1 }} placeholder="https://..." />
              {data.job_url && (
                <a href={data.job_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '0 14px' }}>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Notes</label>
            <textarea value={data.notes || ''} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} className="field" style={{ height: 80, resize: 'none' }} />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
              <Save size={14} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return mounted ? createPortal(modalContent, document.body) : null
}
