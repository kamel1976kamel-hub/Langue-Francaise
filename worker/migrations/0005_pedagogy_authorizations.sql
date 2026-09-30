CREATE TABLE IF NOT EXISTS teacher_module_assignments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_user_id  TEXT    NOT NULL,
  chapter_id       TEXT    NOT NULL CHECK (chapter_id GLOB '*-*'),
  academic_year_id INTEGER NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','orphan')),
  valid_from       TEXT    NOT NULL DEFAULT (datetime('now')),
  valid_to         TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);
