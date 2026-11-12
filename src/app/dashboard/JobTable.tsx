'use client'

import { useState, useEffect, useMemo } from 'react'
import { updateJobStatus, deleteJobApplication } from '@/app/dashboard/actions'
import { JobApplication, JobStatus } from '@/types/job'
import { Trash2, Edit2, Hash, ExternalLink, Search, X, Copy, Clock, Table, LayoutGrid } from 'lucide-react'
import confetti from 'canvas-confetti'
import EditJobModal from './EditJobModal'
import KanbanBoard from './KanbanBoard'

const ALL_STATUSES: JobStatus[] = ['Applied', 'Shortlisted', 'Assessment', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn']

const STATUS_STYLE: Record<JobStatus, { color: string; bg: string }> = {
  Applied:      { color: 'var(--s-applied)',      bg: 'rgba(74,127,165,0.08)' },
  Shortlisted:  { color: '#8b5cf6',               bg: 'rgba(139,92,246,0.09)' },
  Assessment:   { color: '#f59e0b',               bg: 'rgba(245,158,11,0.09)' },
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

function isBlankVal(val?: string | null): boolean {
  if (!val) return true
  const s = val.trim().toLowerCase()
  return s === '' || s === '-' || s === 'n/a' || s === 'na' || s === 'none' || s === 'null' || s === 'undefined'
}

function cleanStr(val?: string | null): string {
  if (!val) return ''
  return val.trim().toLowerCase().replace(/\s+/g, ' ')
}

function cleanUrl(val?: string | null): string {
  if (!val) return ''
  return val.trim().toLowerCase().replace(/\/+$/, '')
}

function daysBetween(dateStr: string): number {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  const diffMs = Date.now() - d.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

type TableFilter = JobStatus | 'All' | 'Duplicates' | 'NeedsFollowUp'

export default function JobTable({ jobs, loading }: { jobs: JobApplication[], loading?: boolean }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [localJobs, setLocalJobs] = useState(jobs)
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<TableFilter>('All')
  const [dateFilter, setDateFilter] = useState('All Time')
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')

  useEffect(() => { setLocalJobs(jobs) }, [jobs])

  // Identify stale applications (applied >= 7 days ago and still in 'Applied')
  const staleJobIds = useMemo(() => {
    const ids = new Set<string>()
    for (const j of localJobs) {
      if (j.status === 'Applied' && j.date_applied && daysBetween(j.date_applied) >= 7) {
        ids.add(j.id)
      }
    }
    return ids
  }, [localJobs])

  // Detect duplicate applications: same job (Job ID, or same Company + Role, or same Job URL)
  const { duplicateJobIds, duplicateReasons } = useMemo(() => {
    const ids = new Set<string>()
    const reasons: Record<string, string> = {}

    for (let i = 0; i < localJobs.length; i++) {
      const a = localJobs[i]
      for (let j = i + 1; j < localJobs.length; j++) {
        const b = localJobs[j]

        // 1. Same non-blank Job ID
        const hasJobId = !isBlankVal(a.job_id) && !isBlankVal(b.job_id)
        const sameJobId = hasJobId && cleanStr(a.job_id) === cleanStr(b.job_id)

        // 2. Same Company AND Same Role (same job, not same company alone!)
        const hasCompAndRole = !isBlankVal(a.company_name) && !isBlankVal(a.role) && !isBlankVal(b.company_name) && !isBlankVal(b.role)
        const sameCompAndRole = hasCompAndRole &&
          cleanStr(a.company_name) === cleanStr(b.company_name) &&
          cleanStr(a.role) === cleanStr(b.role)

        // 3. Same non-blank Job URL
        const hasUrl = !isBlankVal(a.job_url) && !isBlankVal(b.job_url)
        const sameUrl = hasUrl && cleanUrl(a.job_url) === cleanUrl(b.job_url)

        if (sameJobId || sameCompAndRole || sameUrl) {
          ids.add(a.id)
          ids.add(b.id)

          let reason = ''
          if (sameJobId) reason = `Same Job ID: ${a.job_id}`
          else if (sameCompAndRole) reason = `Same Job: ${a.company_name} - ${a.role}`
          else if (sameUrl) reason = 'Same Application URL'

          if (!reasons[a.id]) reasons[a.id] = reason
          if (!reasons[b.id]) reasons[b.id] = reason
        }
      }
    }
    return { duplicateJobIds: ids, duplicateReasons: reasons }
  }, [localJobs])

  // Filter + search logic
  const visibleJobs = useMemo(() => {
    let filtered = localJobs

    if (activeFilter === 'Duplicates') {
      filtered = filtered.filter(j => duplicateJobIds.has(j.id))
    } else if (activeFilter === 'NeedsFollowUp') {
      filtered = filtered.filter(j => staleJobIds.has(j.id))
    } else if (activeFilter !== 'All') {
      filtered = filtered.filter(j => j.status === activeFilter)
    }

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

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(j =>
        j.company_name?.toLowerCase().includes(q) ||
        j.role?.toLowerCase().includes(q) ||
        j.job_id?.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [localJobs, search, activeFilter, dateFilter, duplicateJobIds, staleJobIds])

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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
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

          {/* View mode toggle: Table vs Kanban Board */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                background: viewMode === 'table' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'table' ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              <Table size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              title="Kanban Board View"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                background: viewMode === 'board' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'board' ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: viewMode === 'board' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(tab => {
            const st = tab !== 'All' ? STATUS_STYLE[tab] : null
            const isActive = activeFilter === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                style={{
                  position: 'relative',
                  zIndex: 10,
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

          {/* Duplicates filter tab */}
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'Duplicates' ? 'All' : 'Duplicates')}
            title={duplicateJobIds.size > 0 ? `${duplicateJobIds.size} duplicate applications detected` : 'No duplicate applications'}
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              border: activeFilter === 'Duplicates'
                ? '1.5px solid #E11D48'
                : duplicateJobIds.size > 0
                ? '1.5px solid rgba(225, 29, 72, 0.4)'
                : '1.5px solid var(--border)',
              background: activeFilter === 'Duplicates'
                ? 'rgba(225, 29, 72, 0.08)'
                : duplicateJobIds.size > 0
                ? 'rgba(225, 29, 72, 0.04)'
                : 'transparent',
              color: activeFilter === 'Duplicates'
                ? '#E11D48'
                : duplicateJobIds.size > 0
                ? '#E11D48'
                : 'var(--ink-3)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <Copy size={12} />
            Duplicates
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              background: activeFilter === 'Duplicates' ? 'rgba(225, 29, 72, 0.15)' : 'var(--border)',
              color: activeFilter === 'Duplicates' ? '#E11D48' : 'var(--ink-3)',
              borderRadius: 99,
              padding: '1px 6px',
              minWidth: 18,
              textAlign: 'center',
            }}>
              {duplicateJobIds.size}
            </span>
          </button>

          {/* Needs Follow-Up filter tab */}
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'NeedsFollowUp' ? 'All' : 'NeedsFollowUp')}
            title={staleJobIds.size > 0 ? `${staleJobIds.size} applications need follow-up (>7 days without response)` : 'No applications need follow-up'}
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              border: activeFilter === 'NeedsFollowUp'
                ? '1.5px solid #D97706'
                : staleJobIds.size > 0
                ? '1.5px solid rgba(245, 158, 11, 0.4)'
                : '1.5px solid var(--border)',
              background: activeFilter === 'NeedsFollowUp'
                ? 'rgba(245, 158, 11, 0.08)'
                : staleJobIds.size > 0
                ? 'rgba(245, 158, 11, 0.04)'
                : 'transparent',
              color: activeFilter === 'NeedsFollowUp'
                ? '#D97706'
                : staleJobIds.size > 0
                ? '#D97706'
                : 'var(--ink-3)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <Clock size={12} />
            Needs Follow-Up
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              background: activeFilter === 'NeedsFollowUp' ? 'rgba(245, 158, 11, 0.15)' : 'var(--border)',
              color: activeFilter === 'NeedsFollowUp' ? '#D97706' : 'var(--ink-3)',
              borderRadius: 99,
              padding: '1px 6px',
              minWidth: 18,
              textAlign: 'center',
            }}>
              {staleJobIds.size}
            </span>
          </button>
        </div>
      </div>

      {/* Duplicate Notice Banner when viewing duplicates */}
      {activeFilter === 'Duplicates' && visibleJobs.length > 0 && (
        <div style={{
          background: 'rgba(225, 29, 72, 0.06)',
          border: '1px solid rgba(225, 29, 72, 0.25)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          color: '#BE123C',
          animation: 'fadeIn 200ms ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Copy size={15} />
            <span>
              Showing <strong>{visibleJobs.length}</strong> duplicate entries (matching same Job ID, or same Role &amp; Company). Click any row to review, edit, or delete.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveFilter('All')}
            style={{
              background: 'none',
              border: 'none',
              color: '#BE123C',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            View all applications
          </button>
        </div>
      )}

      {/* Needs Follow-Up Notice Banner */}
      {activeFilter === 'NeedsFollowUp' && visibleJobs.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          color: '#B45309',
          animation: 'fadeIn 200ms ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} />
            <span>
              Showing <strong>{visibleJobs.length}</strong> applications applied over 7 days ago still in &ldquo;Applied&rdquo;. Recommended to follow up with recruiters.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveFilter('All')}
            style={{
              background: 'none',
              border: 'none',
              color: '#B45309',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            View all applications
          </button>
        </div>
      )}

      {/* ── TABLE OR KANBAN BOARD ── */}
      {!loading && visibleJobs.length === 0 ? (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>
            {activeFilter === 'Duplicates' ? '✨' : activeFilter === 'NeedsFollowUp' ? '🎉' : '🔍'}
          </div>
          <h3 className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 8, fontWeight: 400 }}>
            {activeFilter === 'Duplicates'
              ? 'No duplicate applications'
              : activeFilter === 'NeedsFollowUp'
              ? 'No applications need follow-up'
              : 'No results found'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            {activeFilter === 'Duplicates'
              ? 'Great! All your job applications are unique with no duplicate Job IDs or roles.'
              : activeFilter === 'NeedsFollowUp'
              ? 'All applications are up-to-date or have received responses within the last 7 days.'
              : search
              ? `No applications matching "${search}"`
              : 'No matching applications found.'}
          </p>
          <button
            onClick={() => { setSearch(''); setActiveFilter('All'); setDateFilter('All Time'); }}
            className="btn-ghost"
            style={{ marginTop: 16, fontSize: 13 }}
          >
            {activeFilter === 'Duplicates' || activeFilter === 'NeedsFollowUp' ? 'View all applications' : 'Clear filters'}
          </button>
        </div>
      ) : viewMode === 'board' ? (
        <KanbanBoard
          jobs={visibleJobs}
          onStatusChange={handleStatus}
          onEdit={setEditingJob}
          onDelete={handleDelete}
          staleJobIds={staleJobIds}
          duplicateJobIds={duplicateJobIds}
          duplicateReasons={duplicateReasons}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 1100 }}>
              {/* Sticky Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1.5fr) minmax(160px, 1.5fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(100px, 1fr) minmax(160px, 1.5fr) minmax(120px, 1.2fr) 90px', borderBottom: '1px solid var(--border)', background: 'rgba(250, 248, 245, 0.96)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
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
                        
                        <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4, wordBreak: 'break-word', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: '100%' }}>
                          <span>{job.role}</span>
                          {duplicateJobIds.has(job.id) && (
                            <span
                              title={duplicateReasons[job.id] || 'Duplicate application entry'}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#E11D48',
                                background: 'rgba(225, 29, 72, 0.08)',
                                border: '1px solid rgba(225, 29, 72, 0.25)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Copy size={9} /> Duplicate
                            </span>
                          )}
                          {staleJobIds.has(job.id) && (
                            <span
                              title={`Applied ${job.date_applied ? daysBetween(job.date_applied) : 7}+ days ago without response`}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#D97706',
                                background: 'rgba(245, 158, 11, 0.09)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Clock size={9} /> Follow-up
                            </span>
                          )}
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
                              style={{ position: 'absolute', zIndex: 10, inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}>
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
