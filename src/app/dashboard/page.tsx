import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from './actions'
import JobTable from './JobTable'
import AddJobModal from './AddJobModal'
import SettingsModal from './SettingsModal'
import MotivatingQuotes from '@/components/ui/MotivatingQuotes'
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
    .order('created_at', { ascending: false })

  const j = jobs || []
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

        {/* ── GREETING ── */}
        <div className="fade-up" style={{ marginBottom: 40 }}>
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
          <AddJobModal />
        </div>

        {/* ── TABLE ── */}
        <div className="fade-up" style={{ animationDelay: '380ms' }}>
          <JobTable jobs={j as JobApplication[]} />
        </div>

      </main>
    </div>
  )
}
