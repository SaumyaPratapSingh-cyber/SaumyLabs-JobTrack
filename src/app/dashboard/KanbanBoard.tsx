'use client'

import { useState } from 'react'
import { JobApplication, JobStatus } from '@/types/job'
import { Trash2, Edit2, Hash, ExternalLink, Clock, Copy, ChevronRight, MapPin, DollarSign } from 'lucide-react'

const KANBAN_COLUMNS: { status: JobStatus; label: string; color: string; bg: string }[] = [
  { status: 'Applied',      label: 'Applied',      color: 'var(--s-applied)',      bg: 'rgba(74,127,165,0.08)' },
  { status: 'Shortlisted',  label: 'Shortlisted',  color: '#8b5cf6',               bg: 'rgba(139,92,246,0.08)' },
  { status: 'Assessment',   label: 'Assessment',   color: '#f59e0b',               bg: 'rgba(245,158,11,0.08)' },
  { status: 'Interviewing', label: 'Interviewing', color: 'var(--s-interviewing)', bg: 'rgba(193,126,74,0.08)' },
  { status: 'Offer',        label: 'Offer',        color: 'var(--s-offer)',         bg: 'rgba(74,140,92,0.08)' },
  { status: 'Rejected',     label: 'Rejected',     color: 'var(--s-rejected)',      bg: 'rgba(160,64,64,0.08)' },
]

function CompanyFavicon({ company }: { company: string }) {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
  const [err, setErr] = useState(false)
  if (err) return (
    <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ink-2)', flexShrink: 0 }}>
      {company[0]?.toUpperCase()}
    </div>
  )
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={company}
      style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain', background: 'var(--bg-2)', border: '1px solid var(--border)', flexShrink: 0 }}
      onError={() => setErr(true)}
    />
  )
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  const diffMs = Date.now() - d.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

interface KanbanBoardProps {
  jobs: JobApplication[]
  onStatusChange: (id: string, status: JobStatus) => void
  onEdit: (job: JobApplication) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  staleJobIds: Set<string>
  duplicateJobIds: Set<string>
  duplicateReasons: Record<string, string>
}

export default function KanbanBoard({
  jobs,
  onStatusChange,
  onEdit,
  onDelete,
  staleJobIds,
  duplicateJobIds,
  duplicateReasons,
}: KanbanBoardProps) {
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggingId(id)
  }

  const handleDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault()
    setDraggedOverCol(colStatus)
  }

  const handleDragLeave = () => {
    setDraggedOverCol(null)
  }

  const handleDrop = (e: React.DragEvent, colStatus: JobStatus) => {
    e.preventDefault()
    setDraggedOverCol(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      onStatusChange(id, colStatus)
    }
    setDraggingId(null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, alignItems: 'start', overflowX: 'auto', paddingBottom: 16 }}>
      {KANBAN_COLUMNS.map(col => {
        const colJobs = jobs.filter(j => j.status === col.status)
        const isTarget = draggedOverCol === col.status

        return (
          <div
            key={col.status}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.status)}
            style={{
              background: isTarget ? 'var(--surface-2)' : 'var(--surface)',
              borderRadius: 14,
              border: isTarget ? `1.5px dashed ${col.color}` : '1px solid var(--border)',
              padding: '14px 12px',
              minHeight: 460,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              transition: 'all 150ms ease',
              boxShadow: isTarget ? '0 6px 24px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {/* Column Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{col.label}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'var(--bg-2)',
                  color: 'var(--ink-2)',
                  borderRadius: 99,
                  padding: '2px 8px',
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {colJobs.length}
              </span>
            </div>

            {/* Column Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {colJobs.length === 0 ? (
                <div
                  style={{
                    padding: '36px 12px',
                    textAlign: 'center',
                    border: '1px dashed var(--border)',
                    borderRadius: 10,
                    color: 'var(--ink-4)',
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  Drop applications here
                </div>
              ) : (
                colJobs.map(job => {
                  const isStale = staleJobIds.has(job.id)
                  const isDupe = duplicateJobIds.has(job.id)
                  const days = job.date_applied ? daysSince(job.date_applied) : 0

                  return (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={e => handleDragStart(e, job.id)}
                      onClick={() => onEdit(job)}
                      className="card"
                      style={{
                        padding: '12px 14px',
                        background: 'var(--surface)',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        opacity: draggingId === job.id ? 0.4 : 1,
                        transition: 'transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
                      }}
                    >
                      {/* Company & Role */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <CompanyFavicon company={job.company_name} />
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {job.company_name}
                          </span>
                        </div>

                        {job.job_url && (
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ color: 'var(--ink-4)', display: 'flex' }}
                            title="Open link"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.3 }}>
                        {job.role}
                      </div>

                      {/* Badges / Meta */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {job.job_id && (
                          <span
                            title={`Job ID: ${job.job_id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 10,
                              color: 'var(--accent)',
                              background: 'var(--accent-bg)',
                              padding: '1px 6px',
                              borderRadius: 4,
                              fontWeight: 500,
                            }}
                          >
                            <Hash size={9} />
                            <span>{job.job_id}</span>
                          </span>
                        )}

                        {job.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--ink-3)' }}>
                            <MapPin size={10} />
                            {job.location}
                          </span>
                        )}

                        {job.salary_info && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--ink-3)' }}>
                            <DollarSign size={10} />
                            {job.salary_info}
                          </span>
                        )}
                      </div>

                      {/* Stale / Duplicate Alert Badges */}
                      {isDupe && (
                        <div
                          title={duplicateReasons[job.id] || 'Duplicate entry'}
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
                            gap: 4,
                            width: 'fit-content',
                          }}
                        >
                          <Copy size={9} /> Duplicate
                        </div>
                      )}

                      {isStale && (
                        <div
                          title={`Applied ${days} days ago without response`}
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
                            gap: 4,
                            width: 'fit-content',
                          }}
                        >
                          <Clock size={9} /> Follow-up suggested ({days}d)
                        </div>
                      )}

                      {/* Bottom Footer Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border)',
                          paddingTop: 8,
                          marginTop: 2,
                        }}
                      >
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                          {job.date_applied ? new Date(job.date_applied).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                          {/* Quick stage selector */}
                          <select
                            value={job.status}
                            onChange={e => onStatusChange(job.id, e.target.value as JobStatus)}
                            style={{
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              color: 'var(--ink-2)',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Assessment">Assessment</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Withdrawn">Withdrawn</option>
                          </select>

                          <button
                            onClick={e => { e.stopPropagation(); onEdit(job); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 3, display: 'flex' }}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={e => onDelete(job.id, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 3, display: 'flex' }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
