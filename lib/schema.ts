export const schema = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS resource_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  UNIQUE (board_id, name),
  UNIQUE (id, board_id)
);
CREATE TABLE IF NOT EXISTS class_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  UNIQUE (board_id, name),
  UNIQUE (board_id, slug),
  UNIQUE (id, board_id)
);
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_level_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  FOREIGN KEY (class_level_id) REFERENCES class_levels(id) ON DELETE CASCADE,
  UNIQUE (class_level_id, name),
  UNIQUE (class_level_id, slug),
  UNIQUE (id, class_level_id)
);
CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER,
  board_id INTEGER NOT NULL,
  class_level_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  resource_type_id INTEGER NOT NULL,
  exam_year INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  is_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE RESTRICT,
  FOREIGN KEY (class_level_id, board_id) REFERENCES class_levels(id, board_id) ON DELETE RESTRICT,
  FOREIGN KEY (subject_id, class_level_id) REFERENCES subjects(id, class_level_id) ON DELETE RESTRICT,
  FOREIGN KEY (resource_type_id, board_id) REFERENCES resource_types(id, board_id) ON DELETE RESTRICT,
  CHECK (duration IS NULL OR duration > 0),
  CHECK (exam_year >= 1900),
  CHECK (file_size_bytes >= 0)
);
CREATE INDEX IF NOT EXISTS idx_papers_filter
  ON papers(board_id, class_level_id, subject_id, resource_type_id, exam_year);
CREATE INDEX IF NOT EXISTS idx_resource_types_board ON resource_types(board_id);
CREATE INDEX IF NOT EXISTS idx_class_levels_board ON class_levels(board_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_level ON subjects(class_level_id);
CREATE INDEX IF NOT EXISTS idx_papers_board ON papers(board_id);
CREATE INDEX IF NOT EXISTS idx_papers_class_level ON papers(class_level_id);
CREATE INDEX IF NOT EXISTS idx_papers_subject ON papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_papers_resource_type ON papers(resource_type_id);
CREATE INDEX IF NOT EXISTS idx_papers_exam_year ON papers(exam_year);
`;
