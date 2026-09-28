-- Run this in your Supabase Dashboard > SQL Editor

-- Create the job_applications table
CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  date_applied DATE,
  status TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn')),
  salary_info TEXT,
  location TEXT,
  job_url TEXT,
  notes TEXT,
  source_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (users can only see their own data)
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy: users can SELECT their own rows
CREATE POLICY "Users can view their own applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can INSERT their own rows
CREATE POLICY "Users can insert their own applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can UPDATE their own rows
CREATE POLICY "Users can update their own applications"
  ON job_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: users can DELETE their own rows
CREATE POLICY "Users can delete their own applications"
  ON job_applications FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
