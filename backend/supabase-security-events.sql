-- EZPos Web — Security Events (admin security monitoring panel)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS security_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type  TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high')),
  ip          TEXT,
  path        TEXT,
  method      TEXT,
  message     TEXT NOT NULL,
  meta_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events (severity);

-- Server writes via the service_role key only (same pattern as every other
-- table here) — enable RLS with no anon/authenticated policies so the public
-- anon key (which is embedded in client JS) cannot read or write this table.
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
