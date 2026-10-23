import { getSqlDatabase, type SqlDatabase } from "./db";

export type PaperStatus = "review" | "approved" | "soft_delete" | "hidden";

export type PaperInput = {
  title: string;
  description?: string | null;
  duration?: number | null;
  boardId: number;
  classLevelId: number;
  subjectId: number;
  resourceTypeId: number;
  examYear: number;
  filePath: string;
  fileSizeBytes: number;
  status?: PaperStatus;
};

function paperQuery(includeContact: boolean) {
  return `
  SELECT p.id, p.title, p.description, p.exam_year AS year,
    p.duration, p.file_path, p.file_size_bytes, p.downloads_count AS downloads,
    p.upvotes_count AS upvotes, p.downvotes_count AS downvotes,
    ${includeContact ? "cs.contributor_email, cs.comments AS contributor_comments, " : ""}p.status, p.created_at,
    b.id AS board_id, b.name AS board_name,
    b.code AS board, cl.id AS class_level_id, cl.name AS class_level,
    s.id AS subject_id, s.name AS subject, s.accent_color, rt.id AS resource_type_id,
    rt.name AS type
  FROM papers p
  JOIN boards b ON b.id = p.board_id
  JOIN class_levels cl ON cl.id = p.class_level_id
  JOIN subjects s ON s.id = p.subject_id
  JOIN resource_types rt ON rt.id = p.resource_type_id
  ${includeContact ? "LEFT JOIN contributor_submissions cs ON cs.paper_id = p.id" : ""}
`;
}

let servicePromise: Promise<SqlDatabase> | undefined;

async function serviceDb() {
  servicePromise ??= getSqlDatabase().then((db) => {
    ensureSchemaMigrations(db);
    ensureSubjectAccents(db);
    return db;
  });
  return servicePromise;
}

export type ListPapersOptions = {
  admin: boolean;
  limit?: number;
  offset?: number;
  query?: string;
  board?: string;
  boardId?: number;
  classLevel?: string;
  classLevelId?: number;
  subject?: string;
  subjectId?: number;
  type?: string;
  year?: string;
  status?: string;
};

export async function listPapers(options: ListPapersOptions) {
  const db = await serviceDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!options.admin) {
    conditions.push("p.status = 'approved'");
  } else if (options.status && options.status !== "all") {
    conditions.push("p.status = ?");
    params.push(options.status);
  }

  if (options.board) {
    conditions.push("(b.code = ? OR b.name = ?)");
    params.push(options.board, options.board);
  } else if (options.boardId) {
    conditions.push("p.board_id = ?");
    params.push(options.boardId);
  }

  if (options.classLevel) {
    conditions.push("cl.name = ?");
    params.push(options.classLevel);
  } else if (options.classLevelId) {
    conditions.push("p.class_level_id = ?");
    params.push(options.classLevelId);
  }

  if (options.subject) {
    conditions.push("s.name = ?");
    params.push(options.subject);
  } else if (options.subjectId) {
    conditions.push("p.subject_id = ?");
    params.push(options.subjectId);
  }

  if (options.type) {
    conditions.push("rt.name = ?");
    params.push(options.type);
  }

  if (options.year) {
    conditions.push("p.exam_year = ?");
    params.push(Number(options.year) || options.year);
  }

  if (options.query && options.query.trim()) {
    const tokens = options.query.trim().split(/\s+/);
    for (const token of tokens) {
      const pattern = `%${token}%`;
      if (options.admin) {
        conditions.push(
          "(p.title LIKE ? OR p.description LIKE ? OR s.name LIKE ? OR b.name LIKE ? OR b.code LIKE ? OR cl.name LIKE ? OR rt.name LIKE ? OR cs.contributor_email LIKE ?)",
        );
        params.push(
          pattern,
          pattern,
          pattern,
          pattern,
          pattern,
          pattern,
          pattern,
          pattern,
        );
      } else {
        conditions.push(
          "(p.title LIKE ? OR p.description LIKE ? OR s.name LIKE ? OR b.name LIKE ? OR b.code LIKE ? OR cl.name LIKE ? OR rt.name LIKE ?)",
        );
        params.push(
          pattern,
          pattern,
          pattern,
          pattern,
          pattern,
          pattern,
          pattern,
        );
      }
    }
  }

  const whereClause =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*) AS count
    FROM papers p
    JOIN boards b ON b.id = p.board_id
    JOIN class_levels cl ON cl.id = p.class_level_id
    JOIN subjects s ON s.id = p.subject_id
    JOIN resource_types rt ON rt.id = p.resource_type_id
    ${options.admin ? "LEFT JOIN contributor_submissions cs ON cs.paper_id = p.id" : ""}
    ${whereClause}
  `;

  const total =
    params.length > 0
      ? (db.query<{ count: number }>(countQuery).get(...params)?.count ?? 0)
      : (db.query<{ count: number }>(countQuery).get()?.count ?? 0);

  const limit = options.limit ?? (options.admin ? 500 : 20);
  const offset = options.offset ?? 0;

  const dataQuery = `
    ${paperQuery(options.admin)}
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, limit, offset];
  const papers = db.query(dataQuery).all(...queryParams);

  return { papers, total };
}

export async function getPaper(id: string, admin: boolean) {
  const db = await serviceDb();
  return db
    .query(
      `${paperQuery(admin)} WHERE p.id = ?${admin ? "" : " AND p.status = 'approved'"}`,
    )
    .get(id);
}

export async function resolvePaperMetadata(input: {
  boardId?: number;
  classLevelId?: number;
  subjectId?: number;
  resourceTypeId?: number;
  board?: string;
  classLevel?: string;
  subject?: string;
  type?: string;
}) {
  const db = await serviceDb();
  let boardId = input.boardId;
  let classLevelId = input.classLevelId;
  let subjectId = input.subjectId;
  let resourceTypeId = input.resourceTypeId;
  if (!boardId && input.board) {
    boardId = db
      .query<{ id: number }>("SELECT id FROM boards WHERE code = ? OR name = ?")
      .get(input.board, input.board)?.id;
    if (!boardId) {
      const name = input.board.trim();
      const code = `CUSTOM-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      db.prepare("INSERT OR IGNORE INTO boards (name, code) VALUES (?, ?)").run(
        name,
        code,
      );
      boardId = db
        .query<{ id: number }>("SELECT id FROM boards WHERE name = ?")
        .get(name)?.id;
    }
  }
  if (boardId && !classLevelId && input.classLevel) {
    const name = input.classLevel.trim();
    db.prepare(
      "INSERT OR IGNORE INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)",
    ).run(boardId, name, slugify(name));
    classLevelId = db
      .query<{ id: number }>(
        "SELECT id FROM class_levels WHERE board_id = ? AND name = ?",
      )
      .get(boardId, name)?.id;
  }
  if (classLevelId && !subjectId && input.subject) {
    subjectId = db
      .query<{ id: number }>(
        "SELECT id FROM subjects WHERE class_level_id = ? AND name = ?",
      )
      .get(classLevelId, input.subject)?.id;
    if (!subjectId) {
      const name = input.subject.trim();
      db.prepare(
        "INSERT OR IGNORE INTO subjects (class_level_id, name, slug) VALUES (?, ?, ?)",
      ).run(classLevelId, name, slugify(name));
      subjectId = db
        .query<{ id: number }>(
          "SELECT id FROM subjects WHERE class_level_id = ? AND name = ?",
        )
        .get(classLevelId, name)?.id;
    }
  }
  if (boardId && !resourceTypeId) {
    const type = input.type || "";
    if (type) {
      resourceTypeId = db
        .query<{ id: number }>(
          "SELECT id FROM resource_types WHERE board_id = ? AND name = ?",
        )
        .get(boardId, type)?.id;
    }
    if (!resourceTypeId && type) {
      db.prepare(
        "INSERT OR IGNORE INTO resource_types (board_id, name) VALUES (?, ?)",
      ).run(boardId, type.trim());
      resourceTypeId = db
        .query<{ id: number }>(
          "SELECT id FROM resource_types WHERE board_id = ? AND name = ?",
        )
        .get(boardId, type.trim())?.id;
    }
  }
  return { boardId, classLevelId, subjectId, resourceTypeId };
}

export async function hasValidPaperMetadata(input: {
  boardId: number;
  classLevelId: number;
  subjectId: number;
  resourceTypeId: number;
}) {
  const db = await serviceDb();
  const board = db
    .query("SELECT 1 FROM boards WHERE id = ?")
    .get(input.boardId);
  const classLevel = db
    .query("SELECT 1 FROM class_levels WHERE id = ? AND board_id = ?")
    .get(input.classLevelId, input.boardId);
  const subject = db
    .query("SELECT 1 FROM subjects WHERE id = ? AND class_level_id = ?")
    .get(input.subjectId, input.classLevelId);
  const resourceType = db
    .query("SELECT 1 FROM resource_types WHERE id = ? AND board_id = ?")
    .get(input.resourceTypeId, input.boardId);
  return Boolean(board && classLevel && subject && resourceType);
}

export async function createPaper(id: string, input: PaperInput) {
  const db = await serviceDb();
  db.prepare(
    `INSERT INTO papers
    (id, title, description, duration, board_id, class_level_id, subject_id,
     resource_type_id, exam_year, file_path, file_size_bytes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.title,
    input.description || null,
    input.duration || null,
    input.boardId,
    input.classLevelId,
    input.subjectId,
    input.resourceTypeId,
    input.examYear,
    input.filePath,
    input.fileSizeBytes,
    input.status || "review",
  );
}

export async function createContributorSubmission(
  paperId: string,
  email: string,
  comments: string,
) {
  const db = await serviceDb();
  db.prepare(
    "INSERT INTO contributor_submissions (paper_id, contributor_email, comments) VALUES (?, ?, ?)",
  ).run(paperId, email, comments || null);
}

export async function deletePaper(id: string) {
  const db = await serviceDb();
  db.prepare("DELETE FROM contributor_submissions WHERE paper_id = ?").run(id);
  db.prepare("DELETE FROM papers WHERE id = ?").run(id);
}

export async function deleteContributorSubmission(paperId: string) {
  const db = await serviceDb();
  db.prepare("DELETE FROM contributor_submissions WHERE paper_id = ?").run(
    paperId,
  );
}

export async function updatePaper(
  id: string,
  updates: Record<string, string | number>,
) {
  const db = await serviceDb();
  const fields = Object.keys(updates);
  if (!fields.length) return false;
  const result = db
    .prepare(
      `UPDATE papers SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`,
    )
    .run(...fields.map((field) => updates[field]), id);
  if (updates.status && updates.status !== "review") {
    db.prepare("DELETE FROM contributor_submissions WHERE paper_id = ?").run(
      id,
    );
  }
  return Boolean(result.changes);
}

export async function softDeletePaper(id: string) {
  const db = await serviceDb();
  const result = db
    .prepare(
      "UPDATE papers SET status = 'soft_delete' WHERE id = ? AND status != 'soft_delete'",
    )
    .run(id);
  if (result.changes) {
    db.prepare("DELETE FROM contributor_submissions WHERE paper_id = ?").run(
      id,
    );
  }
  return Boolean(result.changes);
}

export async function incrementDownloads(id: string) {
  const db = await serviceDb();
  return Boolean(
    db
      .prepare(
        "UPDATE papers SET downloads_count = downloads_count + 1 WHERE id = ? AND status = 'approved'",
      )
      .run(id).changes,
  );
}

export async function getBoardOptions() {
  const db = await serviceDb();
  const boards = db
    .query(
      `SELECT b.id, b.name, b.code, COUNT(DISTINCT cl.id) AS class_count,
    COUNT(DISTINCT p.id) AS paper_count FROM boards b
    LEFT JOIN class_levels cl ON cl.board_id = b.id LEFT JOIN papers p ON p.board_id = b.id
    GROUP BY b.id ORDER BY b.name`,
    )
    .all() as Array<{ id: number; [key: string]: unknown }>;
  return boards.map((board) => ({
    ...board,
    classLevels: db
      .query(
        "SELECT id, name, slug FROM class_levels WHERE board_id = ? ORDER BY name",
      )
      .all(board.id),
    subjects: db
      .query(
        "SELECT s.id, s.name, s.slug, s.accent_color, cl.id AS class_level_id FROM subjects s JOIN class_levels cl ON cl.id = s.class_level_id WHERE cl.board_id = ? ORDER BY s.name",
      )
      .all(board.id),
    types: db
      .query(
        "SELECT id, name FROM resource_types WHERE board_id = ? ORDER BY name",
      )
      .all(board.id),
  }));
}

export async function createBoard(input: {
  name: string;
  code: string;
  className: string;
  subjectName: string;
}) {
  const db = await serviceDb();
  const board = db
    .prepare("INSERT INTO boards (name, code) VALUES (?, ?)")
    .run(input.name, input.code);
  const boardId = Number(board.lastInsertRowid);
  const level = db
    .prepare("INSERT INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)")
    .run(boardId, input.className, slugify(input.className));
  db.prepare(
    "INSERT INTO subjects (class_level_id, name, slug, accent_color) VALUES (?, ?, ?, '#c97732')",
  ).run(
    Number(level.lastInsertRowid),
    input.subjectName,
    slugify(input.subjectName),
  );
  db.prepare("INSERT INTO resource_types (board_id, name) VALUES (?, ?)").run(
    boardId,
    "Exam paper",
  );
  return boardId;
}

export async function updateBoard(id: number, name: string, code: string) {
  const db = await serviceDb();
  return Boolean(
    db
      .prepare("UPDATE boards SET name = ?, code = ? WHERE id = ?")
      .run(name, code, id).changes,
  );
}

export async function createSubject(input: {
  classLevelId: number;
  name: string;
  accent_color?: string;
}) {
  const db = await serviceDb();
  const accent = input.accent_color || "#c97732";
  const result = db
    .prepare(
      "INSERT INTO subjects (class_level_id, name, slug, accent_color) VALUES (?, ?, ?, ?)",
    )
    .run(input.classLevelId, input.name, slugify(input.name), accent);
  return { id: Number(result.lastInsertRowid) };
}

export async function createClassLevel(input: {
  boardId: number;
  name: string;
}) {
  const db = await serviceDb();
  const result = db
    .prepare("INSERT INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)")
    .run(input.boardId, input.name, slugify(input.name));
  return { id: Number(result.lastInsertRowid) };
}

export async function updateClassLevel(
  id: number,
  updates: { name?: string; slug?: string; accent_color?: string },
) {
  const db = await serviceDb();
  const fields = Object.keys(updates);
  if (!fields.length) return false;
  const result = db
    .prepare(
      `UPDATE class_levels SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    )
    .run(...fields.map((f) => updates[f as keyof typeof updates]), id);
  return Boolean(result.changes);
}

export async function deleteClassLevel(id: number) {
  const db = await serviceDb();
  db.prepare("DELETE FROM class_levels WHERE id = ?").run(id);
}

export async function updateSubject(
  id: number,
  updates: { name?: string; accent_color?: string },
) {
  const db = await serviceDb();
  const fields = Object.keys(updates);
  if (!fields.length) return false;
  const result = db
    .prepare(
      `UPDATE subjects SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    )
    .run(...fields.map((f) => updates[f as keyof typeof updates]), id);
  return Boolean(result.changes);
}

export async function deleteSubject(id: number) {
  const db = await serviceDb();
  db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
}

export async function createResourceType(input: {
  boardId: number;
  name: string;
}) {
  const db = await serviceDb();
  const result = db
    .prepare("INSERT INTO resource_types (board_id, name) VALUES (?, ?)")
    .run(input.boardId, input.name);
  return { id: Number(result.lastInsertRowid) };
}

export async function updateResourceType(id: number, name: string) {
  const db = await serviceDb();
  return Boolean(
    db.prepare("UPDATE resource_types SET name = ? WHERE id = ?").run(name, id)
      .changes,
  );
}

export async function deleteResourceType(id: number) {
  const db = await serviceDb();
  db.prepare("DELETE FROM resource_types WHERE id = ?").run(id);
}

export function isPaperStatus(value: unknown): value is PaperStatus {
  return (
    value === "review" ||
    value === "approved" ||
    value === "soft_delete" ||
    value === "hidden"
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

function subjectAccent(subject: string) {
  return (
    {
      Physics: "#986021",
      Mathematics: "#3f7893",
      Chemistry: "#4e8057",
      "English Literature": "#a85d69",
    }[subject] || "#a85d20"
  );
}

function ensureSubjectAccents(db: SqlDatabase) {
  for (const [name, color] of Object.entries({
    Physics: "#986021",
    Mathematics: "#3f7893",
    Chemistry: "#4e8057",
    "English Literature": "#a85d69",
  })) {
    db.prepare(
      "UPDATE subjects SET accent_color = ? WHERE name = ? AND (accent_color = '#c97732' OR accent_color IS NULL)",
    ).run(color, name);
  }
}

function ensureSchemaMigrations(db: SqlDatabase) {
  try {
    db.run(
      "ALTER TABLE papers ADD COLUMN upvotes_count INTEGER NOT NULL DEFAULT 0",
    );
  } catch {}
  try {
    db.run(
      "ALTER TABLE papers ADD COLUMN downvotes_count INTEGER NOT NULL DEFAULT 0",
    );
  } catch {}
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS paper_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT,
        reporter_email TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS paper_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paper_id TEXT NOT NULL,
        vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
        client_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (paper_id, client_id),
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
      )
    `);
    db.run(
      "CREATE INDEX IF NOT EXISTS idx_reports_paper ON paper_reports(paper_id)",
    );
    db.run(
      "CREATE INDEX IF NOT EXISTS idx_reports_status ON paper_reports(status)",
    );
    db.run(
      "CREATE INDEX IF NOT EXISTS idx_votes_paper ON paper_votes(paper_id)",
    );
  } catch {}
}

export type ReportInput = {
  paperId: string;
  reason: string;
  details?: string | null;
  reporterEmail?: string | null;
};

export async function createPaperReport(input: ReportInput) {
  const db = await serviceDb();
  const res = db
    .prepare(
      "INSERT INTO paper_reports (paper_id, reason, details, reporter_email) VALUES (?, ?, ?, ?)",
    )
    .run(
      input.paperId,
      input.reason,
      input.details || null,
      input.reporterEmail || null,
    );
  return { id: Number(res.lastInsertRowid) };
}

export async function listPaperReports(
  statusOrOptions?: string | { status?: string; paperId?: string },
) {
  const db = await serviceDb();
  let status: string | undefined;
  let paperId: string | undefined;

  if (typeof statusOrOptions === "string") {
    status = statusOrOptions;
  } else if (statusOrOptions) {
    status = statusOrOptions.status;
    paperId = statusOrOptions.paperId;
  }

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status && status !== "all") {
    conditions.push("r.status = ?");
    params.push(status);
  }
  if (paperId) {
    conditions.push("r.paper_id = ?");
    params.push(paperId);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT r.id, r.paper_id, r.reason, r.details, r.reporter_email, r.status, r.created_at,
           COALESCE(p.title, r.paper_id) AS paper_title, COALESCE(p.exam_year, 0) AS paper_year,
           COALESCE(b.code, 'N/A') AS board_code, COALESCE(b.name, 'Unknown Board') AS board_name,
           COALESCE(s.name, 'Unknown Subject') AS subject_name, COALESCE(cl.name, 'N/A') AS class_level
    FROM paper_reports r
    LEFT JOIN papers p ON p.id = r.paper_id
    LEFT JOIN boards b ON b.id = p.board_id
    LEFT JOIN subjects s ON s.id = p.subject_id
    LEFT JOIN class_levels cl ON cl.id = p.class_level_id
    ${whereClause}
    ORDER BY r.created_at DESC
  `;

  return (
    params.length > 0 ? db.query(query).all(...params) : db.query(query).all()
  ) as Array<{
    id: number;
    paper_id: string;
    reason: string;
    details: string | null;
    reporter_email: string | null;
    status: string;
    created_at: string;
    paper_title: string;
    paper_year: number;
    board_code: string;
    board_name: string;
    subject_name: string;
    class_level: string;
  }>;
}

export async function updatePaperReportStatus(
  id: number,
  status: "pending" | "resolved" | "dismissed",
) {
  const db = await serviceDb();
  return Boolean(
    db
      .prepare("UPDATE paper_reports SET status = ? WHERE id = ?")
      .run(status, id).changes,
  );
}

export async function deletePaperReport(id: number) {
  const db = await serviceDb();
  db.prepare("DELETE FROM paper_reports WHERE id = ?").run(id);
}

export async function recordPaperVote(input: {
  paperId: string;
  clientId: string;
  voteType: "up" | "down" | null;
}) {
  const db = await serviceDb();
  const existing = db
    .query<{ id: number; vote_type: string }>(
      "SELECT id, vote_type FROM paper_votes WHERE paper_id = ? AND client_id = ?",
    )
    .get(input.paperId, input.clientId);

  if (input.voteType === null) {
    if (existing) {
      db.prepare("DELETE FROM paper_votes WHERE id = ?").run(existing.id);
    }
  } else if (!existing) {
    db.prepare(
      "INSERT INTO paper_votes (paper_id, vote_type, client_id) VALUES (?, ?, ?)",
    ).run(input.paperId, input.voteType, input.clientId);
  } else if (existing.vote_type !== input.voteType) {
    db.prepare("UPDATE paper_votes SET vote_type = ? WHERE id = ?").run(
      input.voteType,
      existing.id,
    );
  }

  const counts = db
    .query<{ up: number; down: number }>(
      `
    SELECT
      COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) AS up,
      COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) AS down
    FROM paper_votes WHERE paper_id = ?
  `,
    )
    .get(input.paperId) || { up: 0, down: 0 };

  db.prepare(
    "UPDATE papers SET upvotes_count = ?, downvotes_count = ? WHERE id = ?",
  ).run(counts.up, counts.down, input.paperId);

  return {
    upvotes: counts.up,
    downvotes: counts.down,
    userVote: input.voteType,
  };
}

export async function getPaperVoteStatus(paperId: string, clientId?: string) {
  const db = await serviceDb();
  const counts = db
    .query<{ upvotes_count: number; downvotes_count: number }>(
      "SELECT upvotes_count, downvotes_count FROM papers WHERE id = ?",
    )
    .get(paperId);
  let userVote: string | null = null;
  if (clientId) {
    const v = db
      .query<{ vote_type: string }>(
        "SELECT vote_type FROM paper_votes WHERE paper_id = ? AND client_id = ?",
      )
      .get(paperId, clientId);
    if (v) userVote = v.vote_type;
  }
  return {
    upvotes: counts?.upvotes_count ?? 0,
    downvotes: counts?.downvotes_count ?? 0,
    userVote,
  };
}

export async function listPoorPerformingPapers() {
  const db = await serviceDb();
  const query = `
    SELECT p.id, p.title, p.exam_year AS year, p.status, p.created_at,
           p.downloads_count AS downloads, p.upvotes_count AS upvotes, p.downvotes_count AS downvotes,
           b.code AS board, b.name AS board_name, cl.name AS class_level,
           s.name AS subject, s.accent_color, rt.name AS type,
           (SELECT COUNT(*) FROM paper_reports pr WHERE pr.paper_id = p.id AND pr.status = 'pending') AS pending_reports
    FROM papers p
    JOIN boards b ON b.id = p.board_id
    JOIN class_levels cl ON cl.id = p.class_level_id
    JOIN subjects s ON s.id = p.subject_id
    JOIN resource_types rt ON rt.id = p.resource_type_id
    WHERE (p.downvotes_count > 0 AND p.downvotes_count >= p.upvotes_count)
       OR (SELECT COUNT(*) FROM paper_reports pr WHERE pr.paper_id = p.id AND pr.status = 'pending') > 0
    ORDER BY pending_reports DESC, p.downvotes_count DESC, p.upvotes_count ASC
  `;
  return db.query(query).all();
}
