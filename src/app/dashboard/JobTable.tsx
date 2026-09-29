'use client'

import { useState, useEffect, useMemo } from 'react'
import { updateJobStatus, deleteJobApplication } from '@/app/dashboard/actions'
import { JobApplication, JobStatus } from '@/types/job'
import { Trash2, Edit2, Hash, ExternalLink, Search, X } from 'lucide-react'
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
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'All'>('All')
  const [dateFilter, setDateFilter] = useState('All Time')

  useEffect(() => { setLocalJobs(jobs) }, [jobs])

  // Filter + search logic
  const visibleJobs = useMemo(() => {
    let filtered = localJobs

    if (dateFilter !== 'All Time') {
      const now = new Date()
      let cutoff = new Date(0)
      if (dateFilter === 'Today') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (dateFilter === 'Last 7 Days') {
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (dateFilter === 'Last 30 Days') {
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      } else if (dateFilter === 'This Month') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (dateFilter === 'This Year') {
        cutoff = new Date(now.getFullYear(), 0, 1)
      }
      filtered = filtered.filter(j => {
        if (!j.date_applied) return false
        return new Date(j.date_applied) >= cutoff
      })
    }

    if (activeFilter !== 'All') {
      filtered = filtered.filter(j => j.status === activeFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(j =>
        j.company_name?.toLowerCase().includes(q) ||
        j.role?.toLowerCase().includes(q) ||
        j.job_id?.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [localJobs, search, activeFilter, dateFilter])

  const handleStatus = async (id: string, status: JobStatus) => {
    setUpdating(id)
    setLocalJobs(p => p.map(j => j.id === id ? { ...j, status } : j))
    if (status === 'Offer') confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 }, colors: ['#C17E4A', '#4A8C5C', '#F7F4EF', '#1C1814'] })
    await updateJobStatus(id, status)
    setUpdating(null)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Remove this application?')) return
    setUpdating(id)
    setLocalJobs(p => p.filter(j => j.id !== id))
    await deleteJobApplication(id)
    setUpdating(null)
  }

  const HEADS = ['Company', 'Role', 'Job ID', 'Date', 'Location', 'Salary', 'Notes', 'Status', '']

  const FILTER_TABS: (JobStatus | 'All')[] = ['All', ...ALL_STATUSES]

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { All: localJobs.length }
    ALL_STATUSES.forEach(s => { counts[s] = localJobs.filter(j => j.status === s).length })
    return counts
  }, [localJobs])

  return (
    <>
      {/* ── SEARCH & FILTER BAR ── */}
      <div className="card" style={{ background: 'var(--surface)', marginBottom: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* Search input + Date Filter */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, role, or job ID…"
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: search ? 36 : 12,
                paddingTop: 9,
                paddingBottom: 9,
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', padding: 2 }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
              minWidth: 140,
            }}
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(tab => {
            const st = tab !== 'All' ? STATUS_STYLE[tab] : null
            const isActive = activeFilter === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 500,
                  border: isActive
                    ? `1.5px solid ${st?.color ?? 'var(--ink)'}`
                    : '1.5px solid var(--border)',
                  background: isActive
                    ? (st?.bg ?? 'var(--surface-2)')
                    : 'transparent',
                  color: isActive
                    ? (st?.color ?? 'var(--ink)')
                    : 'var(--ink-3)',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {st && isActive && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, display: 'inline-block', flexShrink: 0 }} />
                )}
                {tab}
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: isActive ? 'rgba(0,0,0,0.1)' : 'var(--border)',
                  color: isActive ? (st?.color ?? 'var(--ink)') : 'var(--ink-3)',
                  borderRadius: 99,
                  padding: '1px 6px',
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {filterCounts[tab] ?? 0}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── TABLE ── */}
      {!loading && visibleJobs.length === 0 ? (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <h3 className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 8, fontWeight: 400 }}>No results found</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            No matching applications found.
          </p>
          <button
            onClick={() => { setSearch(''); setActiveFilter('All'); setDateFilter('All Time'); }}
            className="btn-ghost"
            style={{ marginTop: 16, fontSize: 13 }}
          >
            Clear filters
          </button>
        </div>
      ) : (
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
                  : visibleJobs.map((job, i) => {
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

                        <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
                          {job.job_id ? (
                            <span title={job.job_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 4, fontWeight: 500, overflow: 'hidden', maxWidth: '100%' }}>
                              <Hash size={10} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.job_id}</span>
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
                            <span style={{ width: 13 }} />
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
      )}

      {editingJob && <EditJobModal job={editingJob} onClose={() => setEditingJob(null)} />}
    </>
  )
}
