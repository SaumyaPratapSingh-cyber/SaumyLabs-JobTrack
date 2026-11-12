'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, X, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react'
import { JobStatus } from '@/types/job'
import confetti from 'canvas-confetti'

interface ParsedJobRow {
  company_name: string
  role: string
  job_id?: string
  date_applied?: string
  location?: string
  salary_info?: string
  status: JobStatus
  job_url?: string
  notes?: string
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (char === '\r') {
        // ignore
      } else if (char === '\n') {
        currentRow.push(currentField.trim())
        if (currentRow.some(val => val.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = []
        currentField = ''
      } else {
        currentField += char
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(val => val.length > 0)) {
      rows.push(currentRow)
    }
  }

  return rows
}

function normalizeStatus(st?: string): JobStatus {
  if (!st) return 'Applied'
  const s = st.trim().toLowerCase()
  if (s.includes('interview')) return 'Interviewing'
  if (s.includes('offer')) return 'Offer'
  if (s.includes('reject')) return 'Rejected'
  if (s.includes('shortlist')) return 'Shortlisted'
  if (s.includes('assess') || s.includes('test') || s.includes('exam')) return 'Assessment'
  if (s.includes('withdraw')) return 'Withdrawn'
  return 'Applied'
}

export default function ImportModal() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedJobRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successCount, setSuccessCount] = useState<number | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    processFile(f)
  }

  const processFile = (f: File) => {
    setError('')
    setSuccessCount(null)
    setFile(f)

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const text = event.target?.result as string
        if (!text) {
          setError('File is empty.')
          return
        }

        const rawRows = parseCSV(text)
        if (rawRows.length < 2) {
          setError('CSV must contain a header row and at least one data row.')
          return
        }

        const headers = rawRows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
        const compIdx = headers.findIndex(h => h.includes('company') || h.includes('employer') || h.includes('org'))
        const roleIdx = headers.findIndex(h => h.includes('role') || h.includes('title') || h.includes('position'))
        const idIdx = headers.findIndex(h => h.includes('jobid') || h.includes('req') || h.includes('id'))
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('applied'))
        const locIdx = headers.findIndex(h => h.includes('location') || h.includes('city'))
        const salIdx = headers.findIndex(h => h.includes('salary') || h.includes('ctc') || h.includes('pay') || h.includes('comp'))
        const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('stage'))
        const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('link'))
        const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('comment'))

        if (compIdx === -1 || roleIdx === -1) {
          setError('Could not detect "Company" and "Role" columns in CSV header. Please check column titles.')
          return
        }

        const parsed: ParsedJobRow[] = []
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i]
          const company = row[compIdx]?.trim()
          const role = row[roleIdx]?.trim()

          if (!company || !role) continue // skip incomplete row

          parsed.push({
            company_name: company,
            role: role,
            job_id: idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : undefined,
            date_applied: dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : new Date().toISOString().split('T')[0],
            location: locIdx !== -1 && row[locIdx] ? row[locIdx].trim() : undefined,
            salary_info: salIdx !== -1 && row[salIdx] ? row[salIdx].trim() : undefined,
            status: statusIdx !== -1 ? normalizeStatus(row[statusIdx]) : 'Applied',
            job_url: urlIdx !== -1 && row[urlIdx] ? row[urlIdx].trim() : undefined,
            notes: notesIdx !== -1 && row[notesIdx] ? row[notesIdx].trim() : undefined,
          })
        }

        if (parsed.length === 0) {
          setError('No valid jobs found with both company and role.')
          return
        }

        setParsedRows(parsed)
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.')
      }
    }
    reader.readAsText(f)
  }

  const handleDownloadTemplate = () => {
    const templateContent = [
      'Company,Role,Job ID,Date Applied,Location,Salary,Status,Job URL,Notes',
      'Google,Software Engineer,JOB-1029,2026-03-15,Bangalore,₹32 LPA,Interviewing,https://careers.google.com,Round 1 completed',
      'Microsoft,Backend Developer,MS-994,2026-03-18,Remote,$140k,Applied,https://careers.microsoft.com,Referred by alumni',
    ].join('\n')

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'job_tracker_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to import.')

      const toInsert = parsedRows.map(row => ({
        ...row,
        user_id: user.id,
      }))

      const { error: insertErr } = await supabase.from('job_applications').insert(toInsert)
      if (insertErr) throw insertErr

      setSuccessCount(parsedRows.length)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })

      setTimeout(() => {
        setOpen(false)
        window.location.reload()
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Error importing applications.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setFile(null)
      setParsedRows([])
      setError('')
      setSuccessCount(null)
    }, 200)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost"
        style={{ gap: 6, padding: '0 14px' }}
      >
        <Upload size={14} /> Import CSV
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(28,24,20,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 20,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 620,
                boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
                border: '1px solid var(--border)',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Import Applications from CSV</h3>
                    <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>Upload a spreadsheet to import multiple jobs at once</p>
                  </div>
                </div>

                <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {successCount !== null && (
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(74, 140, 92, 0.12)', border: '1px solid rgba(74, 140, 92, 0.3)', color: 'var(--s-offer)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={16} />
                    <span>Successfully imported <strong>{successCount}</strong> applications! Refreshing...</span>
                  </div>
                )}

                {/* Dropzone */}
                {!parsedRows.length && (
                  <label
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 12,
                      padding: '36px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'var(--surface-2)',
                      textAlign: 'center',
                      transition: 'border-color 150ms ease',
                    }}
                  >
                    <Upload size={28} style={{ color: 'var(--accent)', marginBottom: 12 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                      Choose a CSV file or drag &amp; drop
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
                      Supports files exported from JobTrack, Excel, or Google Sheets
                    </span>
                    <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
                    <span className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
                      Select File (.csv)
                    </span>
                  </label>
                )}

                {/* Preview Table */}
                {parsedRows.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                        Preview ({parsedRows.length} applications found)
                      </span>
                      <button
                        type="button"
                        onClick={() => { setParsedRows([]); setFile(null); }}
                        style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Change file
                      </button>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--surface-2)', position: 'sticky', top: 0, borderBottom: '1px solid var(--border)' }}>
                          <tr>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>Company</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>Role</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>Status</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.slice(0, 8).map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--ink)', fontWeight: 500 }}>{row.company_name}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--ink-2)' }}>{row.role}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>{row.status}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>{row.date_applied || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedRows.length > 8 && (
                      <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6, textAlign: 'center' }}>
                        + {parsedRows.length - 8} more applications will be imported
                      </p>
                    )}
                  </div>
                )}

                {/* Template download link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Need sample format?</span>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Download size={13} /> Download Template CSV
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, background: 'var(--surface-2)' }}>
                <button type="button" onClick={handleClose} className="btn-ghost" style={{ fontSize: 13 }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={parsedRows.length === 0 || loading || successCount !== null}
                  className="btn-primary"
                  style={{ fontSize: 13, padding: '7px 18px', opacity: parsedRows.length === 0 || loading ? 0.6 : 1 }}
                >
                  {loading ? 'Importing…' : `Import ${parsedRows.length > 0 ? `${parsedRows.length} Jobs` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
