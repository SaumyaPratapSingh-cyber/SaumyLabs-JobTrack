'use client'

import { useEffect, useState, useMemo } from 'react'
import { Building2 } from 'lucide-react'
import { JobApplication } from '@/types/job'

export default function TodayTracker({ jobs }: { jobs: JobApplication[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { companyCount, uniqueCompanies, applicationCount } = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const todayYMD = `${y}-${m}-${d}`

    const filtered = jobs.filter(job => {
      // 1. If date_applied is set to today
      if (job.date_applied) {
        const appliedYMD = job.date_applied.split('T')[0].trim()
        if (appliedYMD === todayYMD) return true
      }
      // 2. If date_applied is missing, fallback to created_at in local date
      if (!job.date_applied && job.created_at) {
        const cDate = new Date(job.created_at)
        if (!isNaN(cDate.getTime())) {
          const cy = cDate.getFullYear()
          const cm = String(cDate.getMonth() + 1).padStart(2, '0')
          const cd = String(cDate.getDate()).padStart(2, '0')
          const createdYMD = `${cy}-${cm}-${cd}`
          if (createdYMD === todayYMD) return true
        }
      }
      return false
    })

    const companies = Array.from(new Set(
      filtered.map(j => j.company_name?.trim()).filter(Boolean) as string[]
    ))

    return {
      companyCount: companies.length,
      uniqueCompanies: companies,
      applicationCount: filtered.length,
    }
  }, [jobs])

  if (!mounted) return null

  const isActive = companyCount > 0
  const dailyGoal = 5
  const progressPercent = Math.min(Math.round((companyCount / dailyGoal) * 100), 100)

  // Circular gauge meter calculation
  const size = 32
  const strokeWidth = 2.5
  const center = size / 2
  const radius = center - strokeWidth
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const tooltipText = companyCount > 0
    ? `Today: Applied to ${uniqueCompanies.join(', ')} (${applicationCount} application${applicationCount !== 1 ? 's' : ''})`
    : 'No applications logged yet today. Track one to get started!'

  return (
    <div
      className="card fade-up"
      title={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px',
        background: isActive
          ? 'linear-gradient(135deg, rgba(184, 107, 53, 0.12), rgba(184, 107, 53, 0.02))'
          : 'var(--surface-2)',
        border: isActive ? '1px solid rgba(184, 107, 53, 0.35)' : '1px solid var(--border)',
        borderRadius: 99,
        boxShadow: isActive ? '0 4px 20px rgba(184, 107, 53, 0.12)' : 'none',
        animationDelay: '150ms',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* Circular Meter Gauge around Building Icon */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
        >
          {/* Background track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress meter arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isActive ? 'var(--accent)' : 'var(--ink-4)'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        <Building2
          size={15}
          style={{
            color: isActive ? 'var(--accent)' : 'var(--ink-4)',
            transition: 'color 200ms ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isActive ? 'var(--accent)' : 'var(--ink-3)',
              lineHeight: 1,
            }}
          >
            {companyCount} {companyCount === 1 ? 'Company' : 'Companies'}
          </span>
          {companyCount >= dailyGoal && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--s-offer)',
                background: 'rgba(74, 124, 89, 0.12)',
                borderRadius: 99,
                padding: '1px 5px',
                lineHeight: 1.2,
              }}
            >
              Goal Met!
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginTop: 3,
          }}
        >
          {isActive
            ? applicationCount > companyCount
              ? `Applied Today · ${applicationCount} Roles`
              : `Applied Today · ${companyCount}/${dailyGoal} Goal`
            : `Applied Today · 0/${dailyGoal}`}
        </span>
      </div>
    </div>
  )
}
