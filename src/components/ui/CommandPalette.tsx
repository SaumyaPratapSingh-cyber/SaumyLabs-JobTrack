'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { JobApplication, JobStatus } from '@/types/job'
import { Search, Plus, LayoutGrid, Table, BarChart3, Clock, Copy, Upload, Download, ArrowRight, CornerDownLeft } from 'lucide-react'

interface CommandPaletteProps {
  jobs: JobApplication[]
  onSelectJob: (job: JobApplication) => void
  onAction: (actionId: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

interface ActionItem {
  id: string
  title: string
  subtitle: string
  icon: any
  category: 'action'
}

const STATIC_ACTIONS: ActionItem[] = [
  { id: 'add_job', title: 'Add New Application', subtitle: 'Paste email confirmation to extract with AI', icon: Plus, category: 'action' },
  { id: 'view_kanban', title: 'Switch to Kanban Board View', subtitle: 'View applications as pipeline columns', icon: LayoutGrid, category: 'action' },
  { id: 'view_table', title: 'Switch to Table View', subtitle: 'Full spreadsheet table view with all details', icon: Table, category: 'action' },
  { id: 'toggle_analytics', title: 'Toggle Analytics & Funnel', subtitle: 'View conversion rates and hiring velocity', icon: BarChart3, category: 'action' },
  { id: 'filter_followup', title: 'Filter: Needs Follow-Up', subtitle: 'Applications applied >7 days ago with no update', icon: Clock, category: 'action' },
  { id: 'filter_duplicates', title: 'Filter: Duplicate Entries', subtitle: 'Applications with duplicate Job ID or Role', icon: Copy, category: 'action' },
  { id: 'export_csv', title: 'Export Applications to CSV', subtitle: 'Download your entire application history', icon: Download, category: 'action' },
]

export default function CommandPalette({
  jobs,
  onSelectJob,
  onAction,
  open,
  setOpen,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    } else {
      setQuery('')
    }
  }, [open])

  // Filter items
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()

    const matchedActions = STATIC_ACTIONS.filter(
      a => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    )

    const matchedJobs = q
      ? jobs.filter(
          j =>
            j.company_name?.toLowerCase().includes(q) ||
            j.role?.toLowerCase().includes(q) ||
            j.job_id?.toLowerCase().includes(q) ||
            j.location?.toLowerCase().includes(q)
        ).slice(0, 8)
      : jobs.slice(0, 5) // Show recent 5 when query is empty

    return {
      actions: matchedActions,
      jobs: matchedJobs,
      totalCount: matchedActions.length + matchedJobs.length,
    }
  }, [query, jobs])

  const flatList = useMemo(() => {
    return [
      ...filteredItems.actions.map(a => ({ type: 'action' as const, item: a })),
      ...filteredItems.jobs.map(j => ({ type: 'job' as const, item: j })),
    ]
  }, [filteredItems])

  const handleSelect = (index: number) => {
    const target = flatList[index]
    if (!target) return

    setOpen(false)
    if (target.type === 'action') {
      onAction(target.item.id)
    } else {
      onSelectJob(target.item)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, flatList.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + flatList.length) % Math.max(1, flatList.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(selectedIndex)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(28,24,20,0.45)',
          backdropFilter: 'blur(5px)',
          zIndex: 99998,
        }}
      />

      {/* Palette Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: 600,
          zIndex: 99999,
          background: 'var(--surface)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '68vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <Search size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a company, role, or action…"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--ink)',
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: 'var(--bg-2)',
              color: 'var(--ink-3)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ padding: '8px 10px', overflowY: 'auto', flex: 1 }}>
          {flatList.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No matches found for "{query}"
            </div>
          ) : (
            <>
              {/* Actions Section */}
              {filteredItems.actions.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Actions
                  </div>
                  {filteredItems.actions.map(action => {
                    const idx = flatList.findIndex(x => x.type === 'action' && x.item.id === action.id)
                    const isSelected = idx === selectedIndex
                    const Icon = action.icon

                    return (
                      <div
                        key={action.id}
                        onClick={() => handleSelect(idx)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--surface-2)' : 'transparent',
                          transition: 'background 100ms',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: isSelected ? 'var(--accent-bg)' : 'var(--bg-2)', color: isSelected ? 'var(--accent)' : 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? 'var(--ink)' : 'var(--ink-2)' }}>
                              {action.title}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{action.subtitle}</div>
                          </div>
                        </div>

                        {isSelected && <CornerDownLeft size={13} style={{ color: 'var(--ink-3)' }} />}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Jobs Section */}
              {filteredItems.jobs.length > 0 && (
                <div>
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {query ? 'Matching Applications' : 'Recent Applications'}
                  </div>
                  {filteredItems.jobs.map(job => {
                    const idx = flatList.findIndex(x => x.type === 'job' && x.item.id === job.id)
                    const isSelected = idx === selectedIndex

                    return (
                      <div
                        key={job.id}
                        onClick={() => handleSelect(idx)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--surface-2)' : 'transparent',
                          transition: 'background 100ms',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', flexShrink: 0 }}>
                            {job.company_name[0]?.toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? 'var(--ink)' : 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <strong>{job.company_name}</strong> · {job.role}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', gap: 8 }}>
                              {job.job_id && <span>#{job.job_id}</span>}
                              {job.location && <span>{job.location}</span>}
                              <span>{job.status}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Open details</span>
                          {isSelected && <ArrowRight size={12} style={{ color: 'var(--ink-3)' }} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--ink-4)',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Tip: Press <strong>⌘K</strong> anytime</span>
        </div>
      </div>
    </>
  )
}
