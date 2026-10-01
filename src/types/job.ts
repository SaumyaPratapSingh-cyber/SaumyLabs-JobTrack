export type JobStatus = 'Applied' | 'Shortlisted' | 'Assessment' | 'Interviewing' | 'Offer' | 'Rejected' | 'Withdrawn'

export interface JobApplication {
  id: string
  user_id: string
  company_name: string
  role: string
  date_applied: string | null
  status: JobStatus
  salary_info: string | null
  location: string | null
  job_url: string | null
  job_id: string | null
  notes: string | null
  source_text: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  mobile: string | null
  graduation_details: string | null
}
