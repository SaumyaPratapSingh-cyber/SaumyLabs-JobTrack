import { JobStatus } from '@/types/job'

const STATUS_CONFIG: Record<JobStatus, { dot: string; bg: string; text: string; label: string }> = {
  Applied:      { dot: 'bg-[#57534E]', bg: 'bg-stone-100',   text: 'text-[#57534E]', label: 'Applied' },
  Shortlisted:  { dot: 'bg-[#8B5CF6]', bg: 'bg-violet-50',   text: 'text-[#8B5CF6]', label: 'Shortlisted' },
  Assessment:   { dot: 'bg-[#F59E0B]', bg: 'bg-orange-50',   text: 'text-[#F59E0B]', label: 'Assessment' },
  Interviewing: { dot: 'bg-[#B45309]', bg: 'bg-amber-50',    text: 'text-[#B45309]', label: 'Interviewing' },
  Offer:        { dot: 'bg-[#4A7C59]', bg: 'bg-emerald-50',  text: 'text-[#4A7C59]', label: 'Offer' },
  Rejected:     { dot: 'bg-[#9F3A38]', bg: 'bg-rose-50',     text: 'text-[#9F3A38]', label: 'Rejected' },
  Withdrawn:    { dot: 'bg-[#A8A29E]', bg: 'bg-stone-50',    text: 'text-[#A8A29E]', label: 'Withdrawn' },
}

export default function StatusPill({ status, animate }: { status: JobStatus; animate?: boolean }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`status-pill ${cfg.bg} ${cfg.text} ${animate ? 'transition-all duration-300' : ''}`}>
      <span className={`status-dot ${cfg.dot} ${status === 'Applied' ? 'dot-pulse-1' : ''}`} />
      {cfg.label}
    </span>
  )
}
