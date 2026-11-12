import { JobStatus } from '@/types/job'

const STATUS_CONFIG: Record<JobStatus, { dot: string; bg: string; text: string; label: string }> = {
  Applied:      { dot: 'bg-[#826348]', bg: 'bg-[#F4ECE1]', text: 'text-[#826348]', label: 'Applied' },
  Shortlisted:  { dot: 'bg-[#8A5675]', bg: 'bg-[#F7EEF4]', text: 'text-[#8A5675]', label: 'Shortlisted' },
  Assessment:   { dot: 'bg-[#BF7A30]', bg: 'bg-[#FDF3E7]', text: 'text-[#BF7A30]', label: 'Assessment' },
  Interviewing: { dot: 'bg-[#AC5619]', bg: 'bg-[#FAECE3]', text: 'text-[#AC5619]', label: 'Interviewing' },
  Offer:        { dot: 'bg-[#4A7C59]', bg: 'bg-[#EDF5F0]', text: 'text-[#4A7C59]', label: 'Offer' },
  Rejected:     { dot: 'bg-[#9E423E]', bg: 'bg-[#FBEAE9]', text: 'text-[#9E423E]', label: 'Rejected' },
  Withdrawn:    { dot: 'bg-[#82786D]', bg: 'bg-[#F2EFE9]', text: 'text-[#82786D]', label: 'Withdrawn' },
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
