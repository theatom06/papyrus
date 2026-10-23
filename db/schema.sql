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
  accent_color TEXT NOT NULL DEFAULT '#c97732',
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
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  downvotes_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'review'
    CHECK (status IN ('review', 'approved', 'soft_delete', 'hidden')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE RESTRICT,
  FOREIGN KEY (class_level_id, board_id) REFERENCES class_levels(id, board_id) ON DELETE RESTRICT,
  FOREIGN KEY (subject_id, class_level_id) REFERENCES subjects(id, class_level_id) ON DELETE RESTRICT,
  FOREIGN KEY (resource_type_id, board_id) REFERENCES resource_types(id, board_id) ON DELETE RESTRICT,
  CHECK (duration IS NULL OR duration > 0),
  CHECK (exam_year >= 1900),
  CHECK (file_size_bytes >= 0)
);

CREATE TABLE IF NOT EXISTS contributor_submissions (
  paper_id TEXT PRIMARY KEY,
  contributor_email TEXT NOT NULL,
  comments TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS paper_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS paper_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  client_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (paper_id, client_id),
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_paper ON paper_reports(paper_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON paper_reports(status);
CREATE INDEX IF NOT EXISTS idx_votes_paper ON paper_votes(paper_id);
CREATE INDEX IF NOT EXISTS idx_votes_client ON paper_votes(paper_id, client_id);

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
