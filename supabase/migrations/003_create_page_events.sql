-- Create page_events table for analytics tracking from landing page
CREATE TABLE IF NOT EXISTS public.page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  label text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (landing page is public)
CREATE POLICY "Anyone can insert page events"
  ON public.page_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read (internal system dashboard)
CREATE POLICY "Authenticated users can read page events"
  ON public.page_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_events;
