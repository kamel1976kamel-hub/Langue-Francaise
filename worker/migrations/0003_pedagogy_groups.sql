CREATE TABLE IF NOT EXISTS groups (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year_id INTEGER NOT NULL,
  parcours         TEXT    NOT NULL CHECK (parcours IN ('pep','pem','pes')),
  year_number      INTEGER NOT NULL CHECK (year_number BETWEEN 1 AND 2),
  semester_number  INTEGER NOT NULL CHECK (semester_number IN (1,2)),
  name             TEXT    NOT NULL,
  code             TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  capacity         INTEGER CHECK (capacity IS NULL OR capacity > 0),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (academic_year_id, parcours, year_number, semester_number, code)
);
