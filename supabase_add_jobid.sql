-- Add job_id column to existing table
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS job_id TEXT;
