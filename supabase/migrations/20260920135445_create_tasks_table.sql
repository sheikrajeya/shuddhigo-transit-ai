/*
# Create tasks table for Kanban board (single-tenant, no auth)

1. New Tables
- `tasks`
  - `id` (uuid, primary key)
  - `title` (text, not null) — task title
  - `description` (text, nullable) — optional task details
  - `status` (text, not null, default 'backlog') — column: backlog | todo | in-progress | done
  - `priority` (text, not null, default 'medium') — low | medium | high | urgent
  - `color` (text, nullable) — optional accent color tag
  - `sort_order` (integer, not null, default 0) — ordering within a column
  - `due_date` (date, nullable) — optional deadline
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `tasks`.
- Allow anon + authenticated full CRUD — single-tenant app with no sign-in, data is intentionally shared.

3. Indexes
- Index on `status` for column queries.
- Index on `sort_order` for ordering.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in-progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);
