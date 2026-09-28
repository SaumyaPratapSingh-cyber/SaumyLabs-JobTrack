'use client'

import { JobApplication } from '@/types/job'
import { Download } from 'lucide-react'

export default function ExportButton({ jobs }: { jobs: JobApplication[] }) {
  const handleExport = () => {
    if (jobs.length === 0) {
      alert('No applications to export.')
      return
    }

    // CSV Header
    const headers = ['Company', 'Role', 'Job ID', 'Date Applied', 'Location', 'Salary', 'Status', 'Job URL', 'Notes']
    
    // Format rows
    const rows = jobs.map(job => [
      `"${(job.company_name || '').replace(/"/g, '""')}"`,
      `"${(job.role || '').replace(/"/g, '""')}"`,
      `"${(job.job_id || '').replace(/"/g, '""')}"`,
      `"${job.date_applied || ''}"`,
      `"${(job.location || '').replace(/"/g, '""')}"`,
      `"${(job.salary_info || '').replace(/"/g, '""')}"`,
      `"${job.status || ''}"`,
      `"${(job.job_url || '').replace(/"/g, '""')}"`,
      `"${(job.notes || '').replace(/"/g, '""')}"`
    ])

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    
    const date = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `JobTrack_Export_${date}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button onClick={handleExport} className="btn-ghost" style={{ gap: 6, padding: '0 14px' }} aria-label="Export to CSV">
      <Download size={14} /> Export
    </button>
  )
}
