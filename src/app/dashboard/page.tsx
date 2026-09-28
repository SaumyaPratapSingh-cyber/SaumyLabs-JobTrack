import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from './actions'
import JobTable from './JobTable'
import AddJobModal from './AddJobModal'
import ExportButton from './ExportButton'
import SettingsModal from './SettingsModal'
import MotivatingQuotes from '@/components/ui/MotivatingQuotes'
import StreakTracker from '@/components/ui/StreakTracker'
import { JobApplication, UserProfile } from '@/types/job'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import { Briefcase, TrendingUp, MessageSquare, CheckCircle2, XCircle, LogOut } from 'lucide-react'

const STATS = [
  { key: 'total',        label: 'Total',       icon: Briefcase,     color: 'var(--ink)' },
  { key: 'applied',      label: 'Applied',     icon: TrendingUp,    color: 'var(--s-applied)' },
  { key: 'interviewing', label: 'Interviews',  icon: MessageSquare, color: 'var(--s-interviewing)' },
  { key: 'offers',       label: 'Offers',      icon: CheckCircle2,  color: 'var(--s-offer)' },
  { key: 'rejected',     label: 'Rejected',    icon: XCircle,       color: 'var(--s-rejected)' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as UserProfile | null

  const { data: jobs } = await supabase
    .from('job_applications')
    .select('*')
    .order('date_applied', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const j = jobs || []
  
  // Calculate Streak
  let streak = 0
  if (j.length > 0) {
    const appliedDates = Array.from(new Set(
      j.map(x => x.date_applied).filter(Boolean)
    )).sort((a, b) => b!.localeCompare(a!))

    const formatYMD = (d: Date) => {
      const offset = d.getTimezoneOffset()
      const local = new Date(d.getTime() - (offset * 60 * 1000))
      return local.toISOString().split('T')[0]
    }
    
    const today = new Date()
    const dToday = formatYMD(today)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const dYesterday = formatYMD(yesterday)

    let currentDateToCheck = new Date(today)
    
    if (appliedDates.includes(dToday)) {
      streak = 1
      currentDateToCheck = new Date(yesterday)
    } else if (appliedDates.includes(dYesterday)) {
      streak = 1
      currentDateToCheck = new Date(today)
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 2)
    }

    if (streak > 0) {
      while(true) {
        const dCheck = formatYMD(currentDateToCheck)
        if (appliedDates.includes(dCheck)) {
          streak++
          currentDateToCheck.setDate(currentDateToCheck.getDate() - 1)
        } else {
          break
        }
      }
    }
  }

  const stats = {
    total:        j.length,
    applied:      j.filter(x => x.status === 'Applied').length,
    interviewing: j.filter(x => x.status === 'Interviewing').length,
    offers:       j.filter(x => x.status === 'Offer').length,
    rejected:     j.filter(x => x.status === 'Rejected').length,
  }

  const name = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── NAV ── */}
      <header className="nav" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 24, height: 24, background: 'var(--ink)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>💼</div>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>JobTrack</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', marginRight: 6 }}>{profile?.full_name || user.email}</span>
            <SettingsModal profile={profile} />
            <form action={signOut}>
              <button type="submit" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', fontSize: 12 }}>
                <LogOut size={12} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 32px' }}>

        {/* ── GREETING & STREAK ── */}
        <div className="fade-up" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 52px)', color: 'var(--ink)', fontWeight: 400, marginBottom: 6 }}>
              {getGreeting()}, <em style={{ color: 'var(--accent)' }}>{displayName}</em>.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
              {j.length === 0
                ? "Let's track your first application today."
                : `${stats.interviewing} interview${stats.interviewing !== 1 ? 's' : ''} in progress · ${j.length} total`}
            </p>
            <MotivatingQuotes />
          </div>
          
          <div style={{ marginTop: 12 }}>
            <StreakTracker streak={streak} />
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 32 }}>
          {STATS.map(({ key, label, icon: Icon, color }, i) => (
            <div key={key} className="card fade-up" style={{ padding: '20px 20px', animationDelay: `${i * 60}ms` }}>
              <Icon size={15} style={{ color, marginBottom: 14, opacity: 0.75 }} />
              <div style={{ fontSize: 32, fontWeight: 600, color, lineHeight: 1, marginBottom: 6 }}>
                <AnimatedCounter value={(stats as any)[key]} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── TABLE HEADER ── */}
        <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, animationDelay: '320ms' }}>
          <div>
            <h2 style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>Applications</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{j.length} total · newest first</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ExportButton jobs={j as JobApplication[]} />
            <AddJobModal />
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="fade-up" style={{ animationDelay: '380ms' }}>
          <JobTable jobs={j as JobApplication[]} />
        </div>

      </main>
    </div>
  )
}
