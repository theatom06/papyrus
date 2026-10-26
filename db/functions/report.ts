import { getDb } from "../db";
import { type SQLQueryBindings } from "bun:sqlite";

export type ReportInput = {
  paperId: string;
  reason: string;
  details?: string | null;
  reporterEmail?: string | null;
};

export async function createReport(input: ReportInput) {
  const db = await getDb();
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

export async function listReports(
  statusOrOptions?: string | { status?: string; paperId?: string },
) {
  const db = await getDb();
  let status: string | undefined;
  let paperId: string | undefined;

  if (typeof statusOrOptions === "string") {
    status = statusOrOptions;
  } else if (statusOrOptions) {
    status = statusOrOptions.status;
    paperId = statusOrOptions.paperId;
  }

  const conditions: string[] = [];
  const params: SQLQueryBindings[] = [];

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

export async function updateReportStatus(
  id: number,
  status: "pending" | "resolved" | "dismissed",
) {
  const db = await getDb();
  return Boolean(
    db
      .prepare("UPDATE paper_reports SET status = ? WHERE id = ?")
      .run(status, id).changes,
  );
}

export async function deleteReport(id: number) {
  const db = await getDb();
  db.prepare("DELETE FROM paper_reports WHERE id = ?").run(id);
}