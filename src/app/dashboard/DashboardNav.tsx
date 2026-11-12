'use client'

import { useState } from 'react'
import { UserProfile, JobApplication } from '@/types/job'
import { Search, LogOut } from 'lucide-react'
import SettingsModal from './SettingsModal'
import CommandPalette from '@/components/ui/CommandPalette'
import EditJobModal from './EditJobModal'
import { signOut } from './actions'

interface DashboardNavProps {
  profile: UserProfile | null
  userEmail?: string
  jobs: JobApplication[]
}

export default function DashboardNav({ profile, userEmail, jobs }: DashboardNavProps) {
  const [cmdOpen, setCmdOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null)

  const handleAction = (actionId: string) => {
    if (actionId === 'add_job') {
      // Find and click the Add Job button
      const addBtn = document.querySelector('[data-add-job-btn="true"]') as HTMLButtonElement
      if (addBtn) addBtn.click()
    } else if (actionId === 'export_csv') {
      const exportBtn = document.querySelector('[aria-label="Export to CSV"]') as HTMLButtonElement
      if (exportBtn) exportBtn.click()
    } else if (actionId === 'view_kanban') {
      const kanbanBtn = document.querySelector('button[title="Kanban Board View"]') as HTMLButtonElement
      if (kanbanBtn) kanbanBtn.click()
    } else if (actionId === 'view_table') {
      const tableBtn = document.querySelector('button[title="Table View"]') as HTMLButtonElement
      if (tableBtn) tableBtn.click()
    } else if (actionId === 'toggle_analytics') {
      const analyticsBtn = document.querySelector('button:has(svg.lucide-bar-chart-3)') as HTMLButtonElement
      if (analyticsBtn) analyticsBtn.click()
    }
  }

  return (
    <>
      <header className="nav" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 24, height: 24, background: 'var(--ink)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>💼</div>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>JobTrack</span>
            </div>

            {/* Quick Command Bar Trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                borderRadius: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--ink-3)',
                transition: 'border-color 150ms ease',
              }}
            >
              <Search size={13} style={{ color: 'var(--ink-3)' }} />
              <span>Search or command…</span>
              <kbd
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  color: 'var(--ink-2)',
                  fontFamily: 'monospace',
                }}
              >
                ⌘K
              </kbd>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', marginRight: 6 }}>{profile?.full_name || userEmail}</span>
            <SettingsModal profile={profile} />
            <form action={signOut}>
              <button type="submit" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', fontSize: 12 }}>
                <LogOut size={12} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        jobs={jobs}
        open={cmdOpen}
        setOpen={setCmdOpen}
        onSelectJob={job => setEditingJob(job)}
        onAction={handleAction}
      />

      {editingJob && (
        <EditJobModal job={editingJob} onClose={() => setEditingJob(null)} />
      )}
    </>
  )
}
