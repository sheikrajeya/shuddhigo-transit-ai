/*
# ShuddhiGo schema: APSRTC Route 28K hygiene reporting + seat booking + audit logs

## Overview
ShuddhiGo is a civic-transit platform for Visakhapatnam APSRTC Route 28K, bus AP-31-Z-4829.
It provides: public hygiene reporting with Gemini timetable cross-checking, sequential
smart seat booking, and depot audit logs.

## 1. New Tables

### routes
- `id` (uuid PK)
- `route_number` (text, unique) — e.g. "28K"
- `route_name` (text) — display name
- `origin` (text) — starting point
- `destination` (text) — ending point
- `stops` (jsonb) — array of {name, time, sequence}

### buses
- `id` (uuid PK)
- `bus_number` (text, unique) — e.g. "AP-31-Z-4829"
- `route_id` (uuid FK → routes)
- `total_seats` (int) — seat capacity (40)
- `depot` (text) — depot name
- `driver_name` (text)
- `conductor_name` (text)
- `active` (boolean, default true)

### seats
- `id` (uuid PK)
- `bus_id` (uuid FK → buses)
- `seat_number` (int) — 1..40
- `status` (text: available | booked | reserved)
- `booked_by` (text, nullable) — passenger name
- `booked_at` (timestamptz, nullable)
- `booking_ref` (text, nullable) — reference code
- Composite unique on (bus_id, seat_number)

### hygiene_reports
- `id` (uuid PK)
- `bus_number` (text) — reported bus
- `route_number` (text) — reported route
- `category` (text: cleanliness | seats | ac | doors | windows | other)
- `severity` (text: low | medium | high | critical)
- `description` (text)
- `reporter_name` (text, nullable)
- `gemini_verified` (boolean, default false)
- `gemini_summary` (text, nullable) — AI cross-check result
- `gemini_match` (text, nullable) — matched | mismatch | unverified
- `status` (text: open | acknowledged | resolved)
- `created_at` (timestamptz, default now())
- `resolved_at` (timestamptz, nullable)

### audit_logs
- `id` (uuid PK)
- `action` (text: report_created | report_resolved | seat_booked | seat_released | bus_inspected)
- `entity_type` (text)
- `entity_id` (text)
- `details` (jsonb)
- `actor` (text) — who/what performed the action
- `created_at` (timestamptz, default now())

## 2. Security
- RLS enabled on all tables.
- Single-tenant public app (no sign-in): policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`.

## 3. Seed Data
- Route 28K with 10 stops and timetable.
- Bus AP-31-Z-4829 (40 seats).
- All 40 seats initialized as available.
- Sample audit log entry.

## 4. Indexes
- hygiene_reports(bus_number), hygiene_reports(status)
- seats(bus_id, seat_number), seats(bus_id, status)
- audit_logs(created_at)
*/

-- ===== routes =====
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number text UNIQUE NOT NULL,
  route_name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  stops jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_routes" ON routes;
CREATE POLICY "anon_select_routes" ON routes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_routes" ON routes;
CREATE POLICY "anon_insert_routes" ON routes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_routes" ON routes;
CREATE POLICY "anon_update_routes" ON routes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_routes" ON routes;
CREATE POLICY "anon_delete_routes" ON routes FOR DELETE TO anon, authenticated USING (true);

-- ===== buses =====
CREATE TABLE IF NOT EXISTS buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number text UNIQUE NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  total_seats integer NOT NULL DEFAULT 40,
  depot text NOT NULL,
  driver_name text,
  conductor_name text,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_buses" ON buses;
CREATE POLICY "anon_select_buses" ON buses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_buses" ON buses;
CREATE POLICY "anon_insert_buses" ON buses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_buses" ON buses;
CREATE POLICY "anon_update_buses" ON buses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_buses" ON buses;
CREATE POLICY "anon_delete_buses" ON buses FOR DELETE TO anon, authenticated USING (true);

-- ===== seats =====
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'reserved')),
  booked_by text,
  booked_at timestamptz,
  booking_ref text,
  UNIQUE(bus_id, seat_number)
);

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_seats" ON seats;
CREATE POLICY "anon_select_seats" ON seats FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_seats" ON seats;
CREATE POLICY "anon_insert_seats" ON seats FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_seats" ON seats;
CREATE POLICY "anon_update_seats" ON seats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_seats" ON seats;
CREATE POLICY "anon_delete_seats" ON seats FOR DELETE TO anon, authenticated USING (true);

-- ===== hygiene_reports =====
CREATE TABLE IF NOT EXISTS hygiene_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number text NOT NULL,
  route_number text NOT NULL,
  category text NOT NULL CHECK (category IN ('cleanliness', 'seats', 'ac', 'doors', 'windows', 'other')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  reporter_name text,
  gemini_verified boolean NOT NULL DEFAULT false,
  gemini_summary text,
  gemini_match text CHECK (gemini_match IN ('matched', 'mismatch', 'unverified')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE hygiene_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_reports" ON hygiene_reports;
CREATE POLICY "anon_select_reports" ON hygiene_reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reports" ON hygiene_reports;
CREATE POLICY "anon_insert_reports" ON hygiene_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reports" ON hygiene_reports;
CREATE POLICY "anon_update_reports" ON hygiene_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reports" ON hygiene_reports;
CREATE POLICY "anon_delete_reports" ON hygiene_reports FOR DELETE TO anon, authenticated USING (true);

-- ===== audit_logs =====
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('report_created', 'report_resolved', 'seat_booked', 'seat_released', 'bus_inspected')),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_audit" ON audit_logs;
CREATE POLICY "anon_select_audit" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit" ON audit_logs;
CREATE POLICY "anon_insert_audit" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_reports_bus ON hygiene_reports(bus_number);
CREATE INDEX IF NOT EXISTS idx_reports_status ON hygiene_reports(status);
CREATE INDEX IF NOT EXISTS idx_seats_bus_seat ON seats(bus_id, seat_number);
CREATE INDEX IF NOT EXISTS idx_seats_bus_status ON seats(bus_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ===== Drop old tasks table =====
DROP TABLE IF EXISTS tasks CASCADE;

-- ===== Seed Route 28K =====
INSERT INTO routes (route_number, route_name, origin, destination, stops)
SELECT '28K', 'RTC Complex — Steel Plant', 'RTC Complex', 'Steel Plant',
  '[
    {"name":"RTC Complex","time":"06:00","sequence":1},
    {"name":"Akkayyapalem","time":"06:12","sequence":2},
    {"name":"A U Eng College","time":"06:22","sequence":3},
    {"name":"Kancharapalem","time":"06:33","sequence":4},
    {"name":"NAD Junction","time":"06:45","sequence":5},
    {"name":"Hanumanthawaka Junction","time":"06:55","sequence":6},
    {"name":"MVP Colony","time":"07:05","sequence":7},
    {"name":"Yendada","time":"07:18","sequence":8},
    {"name":"Bheemili Road Junction","time":"07:30","sequence":9},
    {"name":"Steel Plant","time":"07:50","sequence":10}
  ]'::jsonb
ON CONFLICT (route_number) DO NOTHING;

-- ===== Seed Bus AP-31-Z-4829 =====
INSERT INTO buses (bus_number, route_id, total_seats, depot, driver_name, conductor_name, active)
SELECT 'AP-31-Z-4829', r.id, 40, 'Dwaraka Bus Station Depot', 'K. Ramesh', 'S. Lakshmi', true
FROM routes r WHERE r.route_number = '28K'
ON CONFLICT (bus_number) DO NOTHING;

-- ===== Seed 40 seats =====
INSERT INTO seats (bus_id, seat_number, status)
SELECT b.id, g.n, 'available'
FROM buses b, generate_series(1, 40) AS g(n
)
WHERE b.bus_number = 'AP-31-Z-4829'
  AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.bus_id = b.id AND s.seat_number = g.n);

-- ===== Seed initial audit log =====
INSERT INTO audit_logs (action, entity_type, entity_id, details, actor)
SELECT 'bus_inspected', 'bus', 'AP-31-Z-4829',
  '{"message":"Bus AP-31-Z-4829 assigned to Route 28K, depot Dwaraka Bus Station Depot, pre-departure inspection complete"}'::jsonb,
  'Depot Manager'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs LIMIT 1);
