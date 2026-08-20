/*
# Create responses table for live data-mining seminar demo

This table stores participant submissions for a real-time data-mining demonstration.
Participants submit their lifestyle attributes (age, sleep, study, recreation hours)
via the participant form. The presenter's dashboard reads these in realtime through
Supabase Realtime subscriptions and runs the 8-stage data-mining pipeline on them.

1. New Tables
- `responses`
  - `id` (uuid, primary key, auto-generated)
  - `participant_id` (text, a short anonymous label like "P1", "P2" assigned by the app)
  - `age` (numeric, participant's age in years)
  - `sleep_hours` (numeric, average sleep hours per night)
  - `study_hours` (numeric, average study hours per day)
  - `recreation_hours` (numeric, average recreation/leisure hours per day)
  - `created_at` (timestamptz, when the response was submitted)
2. Security
- Enable RLS on `responses`.
- This is a single-tenant, no-auth app (seminar demo). All data is intentionally
  public/shared among participants and the presenter. Policies use `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` because the data is meant to be openly
  readable and writable by anyone with the app URL.
3. Realtime
- Added to the publication so the presenter dashboard receives live inserts.
*/

CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id text NOT NULL,
  age numeric NOT NULL CHECK (age > 0 AND age < 130),
  sleep_hours numeric NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  study_hours numeric NOT NULL CHECK (study_hours >= 0 AND study_hours <= 24),
  recreation_hours numeric NOT NULL CHECK (recreation_hours >= 0 AND recreation_hours <= 24),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_responses" ON responses;
CREATE POLICY "anon_select_responses" ON responses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_responses" ON responses;
CREATE POLICY "anon_insert_responses" ON responses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_responses" ON responses;
CREATE POLICY "anon_delete_responses" ON responses FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_responses" ON responses;
CREATE POLICY "anon_update_responses" ON responses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE responses REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
  END IF;
END $$;