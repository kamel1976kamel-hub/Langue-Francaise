CREATE TABLE IF NOT EXISTS academic_years (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT    NOT NULL UNIQUE,
  starts_on  TEXT,
  ends_on    TEXT,
  status     TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
