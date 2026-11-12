'use client'

import { useMemo, useState } from 'react'
import { JobApplication } from '@/types/job'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Target, Award, Calendar, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'

export default function AnalyticsSection({ jobs }: { jobs: JobApplication[] }) {
  const [isOpen, setIsOpen] = useState(false)

  const analytics = useMemo(() => {
    const total = jobs.length
    if (total === 0) return null

    const applied = jobs.filter(j => j.status === 'Applied').length
    const shortlisted = jobs.filter(j => j.status === 'Shortlisted').length
    const assessment = jobs.filter(j => j.status === 'Assessment').length
    const interviewing = jobs.filter(j => j.status === 'Interviewing').length
    const offer = jobs.filter(j => j.status === 'Offer').length
    const rejected = jobs.filter(j => j.status === 'Rejected').length

    // Advanced funnel / conversion
    const reachedInterviewOrBeyond = interviewing + offer
    const interviewConversion = total > 0 ? Math.round((reachedInterviewOrBeyond / total) * 100) : 0
    const offerConversion = reachedInterviewOrBeyond > 0 ? Math.round((offer / reachedInterviewOrBeyond) * 100) : 0
    const activePipeline = applied + shortlisted + assessment + interviewing

    // Funnel Stage Data
    const funnelData = [
      { stage: 'Applied', count: total, fill: '#4A7FA5' },
      { stage: 'Shortlisted', count: shortlisted + assessment + interviewing + offer, fill: '#8B5CF6' },
      { stage: 'Assessment', count: assessment + interviewing + offer, fill: '#F59E0B' },
      { stage: 'Interview', count: interviewing + offer, fill: '#C17E4A' },
      { stage: 'Offer', count: offer, fill: '#4A8C5C' },
    ]

    // Timeline / Velocity Data (Grouped by month/week)
    const dateMap: Record<string, number> = {}
    jobs.forEach(j => {
      const dStr = j.date_applied || j.created_at
      if (!dStr) return
      const d = new Date(dStr)
      if (isNaN(d.getTime())) return
      // Format as "MMM DD" or Month
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dateMap[key] = (dateMap[key] || 0) + 1
    })

    const timelineData = Object.entries(dateMap)
      .slice(-10) // last 10 active dates
      .map(([date, count]) => ({ date, count }))

    return {
      total,
      interviewConversion,
      offerConversion,
      activePipeline,
      offer,
      rejected,
      funnelData,
      timelineData: timelineData.length > 0 ? timelineData : [{ date: 'Today', count: 1 }],
    }
  }, [jobs])

  if (!analytics) return null

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="card"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'var(--surface)',
          cursor: 'pointer',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(193,126,74,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={15} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Pipeline Analytics &amp; Funnel</span>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 8 }}>
              {analytics.interviewConversion}% Interview Rate · {analytics.activePipeline} Active Pipeline
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>
          <span>{isOpen ? 'Hide Insights' : 'View Insights'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded Analytics Drawer */}
      {isOpen && (
        <div className="card fade-up" style={{ marginTop: 10, padding: 24, background: 'var(--surface)', borderRadius: 14 }}>
          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--s-applied)', marginBottom: 6 }}>
                <Target size={15} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interview Conversion</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{analytics.interviewConversion}%</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Applications reaching interviews</div>
            </div>

            <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--s-offer)', marginBottom: 6 }}>
                <Award size={15} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Offer Conversion</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{analytics.offerConversion}%</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Interviews converting to offers</div>
            </div>

            <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', marginBottom: 6 }}>
                <TrendingUp size={15} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Pipeline</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{analytics.activePipeline}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Jobs currently in motion</div>
            </div>

            <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-2)', marginBottom: 6 }}>
                <Calendar size={15} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Offers Won</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--s-offer)' }}>{analytics.offer}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Job offers achieved 🎉</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Funnel Chart */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', background: 'var(--bg)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>Hiring Funnel Progression</h4>
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis type="number" stroke="var(--ink-3)" fontSize={11} />
                    <YAxis type="category" dataKey="stage" stroke="var(--ink-2)" fontSize={12} width={75} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: any) => [`${val} jobs`, 'Volume']}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Velocity / Application Timeline Chart */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', background: 'var(--bg)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>Application Velocity (Recent Activity)</h4>
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="appliedColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A7FA5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4A7FA5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="date" stroke="var(--ink-3)" fontSize={11} />
                    <YAxis stroke="var(--ink-3)" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: any) => [`${val} applications`, 'Applied']}
                    />
                    <Area type="monotone" dataKey="count" stroke="#4A7FA5" strokeWidth={2} fillOpacity={1} fill="url(#appliedColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
