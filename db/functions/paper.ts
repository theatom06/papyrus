import { getDb } from "../db";
import { type SQLQueryBindings } from "bun:sqlite";

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

export type PaperStatus = "review" | "approved" | "soft_delete" | "hidden";

export async function createPaper(id: string, input: PaperInput) {
  const db = await getDb();
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

export async function getPaper(id: string, admin: boolean) {
  const db = await getDb();
  return db
    .query(
      `${paperQuery(admin)} WHERE p.id = ?${admin ? "" : " AND p.status = 'approved'"}`,
    )
    .get(id);
}

export async function updatePaper(
  id: string,
  updates: Record<string, string | number>,
) {
  const db = await getDb();
  const fields = Object.keys(updates).filter(
    (field) => updates[field as keyof typeof updates] !== undefined,
  );
  if (!fields.length) return false;
  const values = fields.map(
    (field) => updates[field as keyof typeof updates] as string,
  );
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
  const db = await getDb();
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

export async function deletePaper(id: string) {
  const db = await getDb();
  db.prepare("DELETE FROM contributor_submissions WHERE paper_id = ?").run(id);
  db.prepare("DELETE FROM papers WHERE id = ?").run(id);
}

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
  const db = await getDb();
  const conditions: string[] = [];
  const params: SQLQueryBindings[] = [];

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
      ? (db.query<{ count: number }, SQLQueryBindings[]>(countQuery).get(...params)?.count ?? 0)
      : (db.query<{ count: number }, SQLQueryBindings[]>(countQuery).get()?.count ?? 0);

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

export function isPaperStatus(value: unknown): value is PaperStatus {
  return (
    value === "review" ||
    value === "approved" ||
    value === "soft_delete" ||
    value === "hidden"
  );
}

export async function listPoorPerformingPapers() {
  const db = await getDb();
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