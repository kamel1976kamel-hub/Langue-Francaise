CREATE TABLE IF NOT EXISTS student_group_memberships (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  group_id   INTEGER NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  valid_from TEXT    NOT NULL DEFAULT (datetime('now')),
  valid_to   TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
