-- DialSafe Database Schema
-- Shared schema for brands, scam reports, and logged checks

CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',          -- lowercase, e.g. {'zomato','zomato ltd','zomato care'}
  official_numbers TEXT[] NOT NULL DEFAULT '{}', -- normalized (+91... or toll-free)
  source_url TEXT NOT NULL,                      -- company's own website/app page
  last_checked DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  number TEXT NOT NULL,                          -- normalized
  brand TEXT,                                    -- brand name or NULL
  note TEXT,
  source TEXT NOT NULL CHECK (source IN ('web','whatsapp','sample')),
  reporter_key TEXT,                             -- web: client IP; whatsapp: hashed sender id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checks (
  id SERIAL PRIMARY KEY,
  number TEXT NOT NULL,
  brand TEXT,
  verdict TEXT NOT NULL CHECK (verdict IN ('verified_official','high_risk','suspicious','unknown')),
  score INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_number ON reports(number);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checks_created ON checks(created_at DESC);
