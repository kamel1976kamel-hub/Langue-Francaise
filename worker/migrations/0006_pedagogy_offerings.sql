CREATE TABLE IF NOT EXISTS group_module_offerings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id        INTEGER NOT NULL,
  chapter_id      TEXT    NOT NULL CHECK (chapter_id GLOB '*-*'),
  teacher_user_id TEXT,
  status          TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','orphan')),
  valid_from      TEXT    NOT NULL DEFAULT (datetime('now')),
  valid_to        TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
