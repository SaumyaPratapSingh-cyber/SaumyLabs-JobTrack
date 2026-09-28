import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ArrowRight, Zap, BarChart2, RefreshCw } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, background: 'var(--ink)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>💼</div>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', letterSpacing: '-0.01em' }}>JobTrack</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/login" style={{ fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none', padding: '6px 12px' }}>Sign in</Link>
            <Link href="/login" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              Get started <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '100px 28px 80px' }}>
        <div className="fade-up" style={{ maxWidth: 680 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 24 }}>
            AI-Powered · Free Forever
          </span>

          <h1 className="serif" style={{ fontSize: 'clamp(52px, 7vw, 88px)', lineHeight: 1.05, color: 'var(--ink)', marginBottom: 28, fontWeight: 400 }}>
            Your job hunt,<br />
            <em style={{ color: 'var(--accent)' }}>finally</em> quiet.
          </h1>

          <p style={{ fontSize: 18, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 36, maxWidth: 480 }}>
            Paste any job email. AI reads company, role, salary and status in seconds. No spreadsheets. No manual entry. Ever.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login" className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
              Start tracking free <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="btn-ghost" style={{ padding: '12px 20px', fontSize: 14 }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD MOCKUP ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px 100px' }}>
        <div className="card fade-up" style={{ overflow: 'hidden', boxShadow: '0 8px 40px rgba(28,24,20,0.1)', animationDelay: '120ms' }}>
          {/* Mock nav bar */}
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, background: 'var(--ink)', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💼</div>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>JobTrack</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>you@example.com</div>
          </div>

          {/* Mock content */}
          <div style={{ padding: 28, background: 'var(--bg)' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 className="serif" style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>Good morning, Jack.</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>3 interviews in progress · 1 offer · 24 total applications</p>
            </div>

            {/* Mock stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Total', val: '24', c: 'var(--ink)' },
                { label: 'Applied', val: '14', c: 'var(--s-applied)' },
                { label: 'Interviews', val: '3', c: 'var(--s-interviewing)' },
                { label: 'Offers', val: '1', c: 'var(--s-offer)' },
                { label: 'Rejected', val: '6', c: 'var(--s-rejected)' },
              ].map(({ label, val, c }) => (
                <div key={label} className="card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: c, marginBottom: 4 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Mock table */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '10px 20px', gap: 16 }}>
                {['Company', 'Role', 'Date', 'Salary', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {[
                { co: '🟢 Google', role: 'Software Engineer', d: '25 Sep', sal: '₹28 LPA', st: 'Interviewing', sc: 'var(--s-interviewing)', sb: 'rgba(193,126,74,0.1)' },
                { co: '🔵 Microsoft', role: 'Product Manager', d: '22 Sep', sal: '₹35 LPA', st: 'Applied', sc: 'var(--s-applied)', sb: 'rgba(74,127,165,0.08)' },
                { co: '🟠 Amazon', role: 'Backend Engineer', d: '20 Sep', sal: '₹32 LPA', st: 'Offer', sc: 'var(--s-offer)', sb: 'rgba(74,140,92,0.1)' },
              ].map(row => (
                <div key={row.co} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '14px 20px', gap: 16, borderBottom: '1px solid var(--border)', alignItems: 'center', background: 'var(--surface)' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{row.co}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{row.role}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{row.d}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{row.sal}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: row.sc, background: row.sb, padding: '3px 9px', borderRadius: 99 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: row.sc, display: 'inline-block' }} />
                    {row.st}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 28px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>Why JobTrack</p>
          <h2 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 52px)', color: 'var(--ink)', textAlign: 'center', marginBottom: 56, fontWeight: 400 }}>
            Built for the modern job seeker
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: <Zap size={18} style={{ color: 'var(--accent)' }} />, title: 'AI Extraction', desc: 'Paste a job email. AI extracts company, role, salary, job ID, location and status automatically.' },
              { icon: <BarChart2 size={18} style={{ color: 'var(--accent)' }} />, title: 'Live Pipeline', desc: 'See your full job pipeline at a glance. Applied, Interviewing, Offers — all tracked beautifully.' },
              { icon: <RefreshCw size={18} style={{ color: 'var(--accent)' }} />, title: 'One-Click Updates', desc: 'Update status instantly as you progress. Everything stays in sync and organised.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: 28, background: 'var(--surface-2)' }}>
                <div style={{ marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 28px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 className="serif" style={{ fontSize: 'clamp(36px, 5vw, 60px)', color: 'var(--ink)', marginBottom: 20, fontWeight: 400 }}>
            Ready to take control?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', marginBottom: 36, lineHeight: 1.65 }}>
            Start tracking for free. No credit card. No setup. Just paste and go.
          </p>
          <Link href="/login" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
            Get started — it&apos;s free <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1120, margin: '0 auto' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>© 2026 SaumyaLabs JobTrack</span>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          In collaboration with SaumyLabs · <a href="https://instagram.com/saumylabs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Follow @saumylabs on Instagram</a>
        </span>
      </footer>
    </div>
  )
}
