'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { addJobApplication } from './actions'
import { JobStatus } from '@/types/job'
import { X, Sparkles, ArrowLeft, Save } from 'lucide-react'

interface ParsedJob {
  company_name: string; role: string; date_applied?: string; status: JobStatus
  salary_info?: string; location?: string; job_url?: string; job_id?: string; notes?: string
}

const STEPS = ['Paste', 'Reading…', 'Review']

const FIELDS = [
  { key: 'company_name', label: 'Company', placeholder: 'e.g. Google' },
  { key: 'role',         label: 'Role',    placeholder: 'e.g. Software Engineer' },
  { key: 'job_id',       label: 'Job ID',  placeholder: 'e.g. JOB-12345' },
  { key: 'salary_info',  label: 'Salary',  placeholder: 'e.g. ₹28 LPA' },
  { key: 'location',     label: 'Location',placeholder: 'e.g. Bangalore, Remote' },
  { key: 'job_url',      label: 'Job URL', placeholder: 'https://...' },
  { key: 'notes',        label: 'Notes',   placeholder: 'Recruiter, deadline…' },
]

export default function AddJobModal() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)

  useEffect(() => setMounted(true), [])

  const handleParse = async () => {
    if (!text.trim()) return
    setLoading(true); setError(''); setStep(1)
    try {
      const res = await fetch('/api/parse-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setParsed(data); setStep(2)
    } catch (e: any) { setError(e.message); setStep(0) } finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!parsed) return
    setLoading(true)
    try { await addJobApplication({ ...parsed, source_text: text }); handleClose() }
    catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => { setText(''); setParsed(null); setStep(0); setError('') }, 300)
  }

  const modalContent = (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,24,20,0.35)', backdropFilter: 'blur(4px)', zIndex: 9999, transition: 'opacity 250ms', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }} />

      {/* Modal */}
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20, pointerEvents: 'none' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 640, boxShadow: '0 24px 80px rgba(28,24,20,0.16)', border: '1px solid var(--border)', pointerEvents: 'auto', transition: 'all 280ms cubic-bezier(0.22,1,0.36,1)', transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(16px)', opacity: open ? 1 : 0 }}>

          {/* Header */}
          <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 className="serif" style={{ fontSize: 24, color: 'var(--ink)', fontWeight: 400 }}>Add Application</h2>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>Paste job email — AI extracts everything</p>
              </div>
              <button onClick={handleClose} style={{ color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 150ms' }}>
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: i <= step ? 'var(--ink)' : 'var(--bg-2)', color: i <= step ? 'var(--bg)' : 'var(--ink-3)', transition: 'all 250ms' }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 12, color: i === step ? 'var(--ink)' : 'var(--ink-4)', fontWeight: i === step ? 500 : 400, transition: 'color 250ms' }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width: 28, height: 1, background: i < step ? 'var(--ink)' : 'var(--border)', transition: 'background 300ms' }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {/* Step 0 */}
            {step === 0 && (
              <div className="fade-in">
                <textarea value={text} onChange={e => setText(e.target.value)} autoFocus={open}
                  placeholder={`Paste your job confirmation email or application text…\n\nExample:\n"Congratulations! You have applied for Software Engineer (Job ID: SE-4521) at Google on 27 Sep 2026. Location: Bangalore. CTC: ₹28 LPA."`}
                  className="field" style={{ height: 200, resize: 'none', lineHeight: 1.65, fontSize: 14 }} />
                {error && <p style={{ color: 'var(--s-rejected)', fontSize: 13, marginTop: 10, background: 'rgba(160,64,64,0.06)', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button onClick={handleClose} className="btn-ghost" style={{ padding: '9px 16px' }}>Cancel</button>
                  <button onClick={handleParse} disabled={!text.trim() || loading} className="btn-primary" style={{ padding: '9px 18px', opacity: !text.trim() ? 0.45 : 1 }}>
                    <Sparkles size={14} /> Extract with AI
                  </button>
                </div>
              </div>
            )}

            {/* Step 1 — Loading */}
            {step === 1 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 0' }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink)' }} className={['dp1','dp2','dp3'][i]} />
                  ))}
                </div>
                <p style={{ fontWeight: 500, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>Reading your application…</p>
                <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>AI is extracting company, role, job ID, salary & more</p>
              </div>
            )}

            {/* Step 2 — Review */}
            {step === 2 && parsed && (
              <div className="fade-in">
                <p style={{ fontSize: 13, color: 'var(--s-offer)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✅</span> Extracted! Review and edit before saving.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <input value={(parsed as any)[key] || ''} onChange={e => setParsed({ ...parsed, [key]: e.target.value })} placeholder={placeholder} className="field" style={{ fontSize: 13, padding: '9px 12px' }} />
                    </div>
                  ))}
                  <div>
                    <label className="label">Date Applied</label>
                    <input type="date" value={parsed.date_applied || ''} onChange={e => setParsed({ ...parsed, date_applied: e.target.value })} className="field" style={{ fontSize: 13, padding: '9px 12px' }} />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select value={parsed.status} onChange={e => setParsed({ ...parsed, status: e.target.value as JobStatus })} className="field" style={{ fontSize: 13, padding: '9px 12px' }}>
                      {['Applied','Interviewing','Offer','Rejected','Withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {error && <p style={{ color: 'var(--s-rejected)', fontSize: 13, marginTop: 14, background: 'rgba(160,64,64,0.06)', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                  <button onClick={() => setStep(0)} className="btn-ghost" style={{ padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={13} /> Back
                  </button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleClose} className="btn-ghost" style={{ padding: '9px 16px' }}>Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
                      <Save size={14} /> {loading ? 'Saving…' : 'Save Application'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary" style={{ gap: 7 }}>
        <Sparkles size={14} /> Add Application
      </button>
      {mounted && createPortal(modalContent, document.body)}
    </>
  )
}
