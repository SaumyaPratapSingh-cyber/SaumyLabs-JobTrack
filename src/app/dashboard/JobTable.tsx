'use client'

import { useState, useEffect } from 'react'
import { updateJobStatus, deleteJobApplication } from '@/app/dashboard/actions'
import { JobApplication, JobStatus } from '@/types/job'
import { Trash2, Edit2, Hash, ExternalLink } from 'lucide-react'
import confetti from 'canvas-confetti'
import EditJobModal from './EditJobModal'

const ALL_STATUSES: JobStatus[] = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn']

const STATUS_STYLE: Record<JobStatus, { color: string; bg: string }> = {
  Applied:      { color: 'var(--s-applied)',      bg: 'rgba(74,127,165,0.08)' },
  Interviewing: { color: 'var(--s-interviewing)', bg: 'rgba(193,126,74,0.09)' },
  Offer:        { color: 'var(--s-offer)',         bg: 'rgba(74,140,92,0.09)' },
  Rejected:     { color: 'var(--s-rejected)',      bg: 'rgba(160,64,64,0.08)' },
  Withdrawn:    { color: 'var(--s-withdrawn)',     bg: 'rgba(138,129,120,0.09)' },
}

function CompanyFavicon({ company }: { company: string }) {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
  const [err, setErr] = useState(false)
  if (err) return (
    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ink-2)', flexShrink: 0 }}>
      {company[0]?.toUpperCase()}
    </div>
  )
  return (
    <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt={company}
      style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain', background: 'var(--bg-2)', border: '1px solid var(--border)', flexShrink: 0 }}
      onError={() => setErr(true)}
    />
  )
}

function SkeletonRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1.5fr) minmax(160px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(140px, 1.5fr) minmax(120px, 1.2fr) 90px', borderBottom: '1px solid var(--border)' }}>
      {[120, 160, 80, 80, 70, 60, 100, 70, 32].map((w, i) => (
        <div key={i} style={{ padding: '14px 16px', borderRight: i < 8 ? '1px solid var(--border)' : 'none' }}>
          <div className="skeleton" style={{ height: 13, width: w }} />
        </div>
      ))}
    </div>
  )
}

export default function JobTable({ jobs, loading }: { jobs: JobApplication[], loading?: boolean }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [localJobs, setLocalJobs] = useState(jobs)
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null)

  useEffect(() => { setLocalJobs(jobs) }, [jobs])

  const handleStatus = async (id: string, status: JobStatus) => {
    setUpdating(id)
    setLocalJobs(p => p.map(j => j.id === id ? { ...j, status } : j))
    if (status === 'Offer') confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 }, colors: ['#C17E4A', '#4A8C5C', '#F7F4EF', '#1C1814'] })
    await updateJobStatus(id, status)
    setUpdating(null)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (!confirm('Remove this application?')) return
    setUpdating(id)
    setLocalJobs(p => p.filter(j => j.id !== id))
    await deleteJobApplication(id)
    setUpdating(null)
  }

  const HEADS = ['Company', 'Role', 'Job ID', 'Date', 'Location', 'Salary', 'Notes', 'Status', '']

  if (!loading && localJobs.length === 0) return (
    <div className="card" style={{ padding: '72px 40px', textAlign: 'center', background: 'var(--surface)' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>🗂️</div>
      <h3 className="serif" style={{ fontSize: 26, color: 'var(--ink)', marginBottom: 10, fontWeight: 400 }}>No applications yet</h3>
      <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65, maxWidth: 320, margin: '0 auto' }}>
        Click <strong>Add Application</strong> and paste any job email.<br />
        <span style={{ color: 'var(--accent)' }}>AI handles the rest. You&apos;ve got this. ✦</span>
      </p>
    </div>
  )

  return (
    <>
      <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 1100 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1.5fr) minmax(160px, 1.5fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(100px, 1fr) minmax(160px, 1.5fr) minmax(120px, 1.2fr) 90px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              {HEADS.map((h, i) => (
                <div key={i} style={{ padding: '12px 16px', fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderRight: i < 8 ? '1px solid var(--border)' : 'none' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Body */}
            <div>
              {loading
                ? [1,2,3].map(i => <SkeletonRow key={i} />)
                : localJobs.map((job, i) => {
                  const st = STATUS_STYLE[job.status as JobStatus] ?? STATUS_STYLE.Applied
                  return (
                    <div key={job.id} onClick={() => setEditingJob(job)} className="job-row row-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1.5fr) minmax(160px, 1.5fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(100px, 1fr) minmax(160px, 1.5fr) minmax(120px, 1.2fr) 90px', borderBottom: '1px solid var(--border)', animationDelay: `${i * 45}ms`, opacity: updating === job.id ? 0.5 : 1, transition: 'opacity 200ms, background 150ms', alignItems: 'center', cursor: 'pointer' }}>
                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, height: '100%' }}>
                        <CompanyFavicon company={job.company_name} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company_name}</span>
                      </div>
                      
                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4, wordBreak: 'break-word', display: 'flex', alignItems: 'center', height: '100%' }}>
                        {job.role}
                      </div>

                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', height: '100%' }}>
                        {job.job_id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 4, fontWeight: 500, whiteSpace: 'nowrap' }}>
                            <Hash size={10} />
                            {job.job_id}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>-</span>
                        )}
                      </div>

                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', height: '100%' }}>
                        {job.date_applied ? new Date(job.date_applied).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>

                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', height: '100%' }}>
                        {job.location || '-'}
                      </div>

                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', height: '100%' }}>
                        {job.salary_info || '-'}
                      </div>

                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', height: '100%' }}>
                        {job.notes || '-'}
                      </div>

                      <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', height: '100%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                          <span className="status-pill" style={{ color: st.color, background: st.bg, width: 'fit-content' }}>
                            <span className="status-dot" style={{ background: st.color }} />
                            {job.status}
                          </span>
                          <select value={job.status} onChange={e => handleStatus(job.id, e.target.value as JobStatus)}
                            disabled={updating === job.id}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ padding: '12px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%' }}>
                        {job.job_url ? (
                          <a href={job.job_url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ color: 'var(--ink-4)', transition: 'color 150ms', display: 'flex', alignItems: 'center' }}
                            onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')}
                            onMouseOut={e => (e.currentTarget.style.color = 'var(--ink-4)')}
                            title="Open Job Link">
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span style={{ width: 13 }} /> /* Spacer for alignment */
                        )}
                        <button onClick={e => { e.stopPropagation(); setEditingJob(job); }}
                          style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 150ms', display: 'flex', alignItems: 'center' }}
                          onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseOut={e => (e.currentTarget.style.color = 'var(--ink-4)')}
                          title="Edit Details">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={e => handleDelete(job.id, e)} disabled={updating === job.id}
                          style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 150ms', display: 'flex', alignItems: 'center' }}
                          onMouseOver={e => (e.currentTarget.style.color = 'var(--s-rejected)')}
                          onMouseOut={e => (e.currentTarget.style.color = 'var(--ink-4)')}
                          title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
      {editingJob && <EditJobModal job={editingJob} onClose={() => setEditingJob(null)} />}
    </>
  )
}
