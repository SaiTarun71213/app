-- Create enquiries table for admission enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  child_name TEXT NOT NULL,
  child_dob DATE NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('Nursery', 'LKG', 'UKG')),
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_messages table for contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for public forms (no auth required for submitting)
CREATE POLICY "Allow anonymous inserts for enquiries" ON enquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts for contact_messages" ON contact_messages
  FOR INSERT WITH CHECK (true);
