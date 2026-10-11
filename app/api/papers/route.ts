import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const paperQuery = `
  SELECT p.id, p.title, p.description, p.exam_year AS year,
    p.duration, p.file_path, p.file_size_bytes, p.downloads_count AS downloads,
    p.is_verified, p.created_at, b.name AS board_name, b.code AS board,
    cl.name AS class_level, s.name AS subject, rt.name AS type
  FROM papers p
  JOIN boards b ON b.id = p.board_id
  JOIN class_levels cl ON cl.id = p.class_level_id
  JOIN subjects s ON s.id = p.subject_id
  JOIN resource_types rt ON rt.id = p.resource_type_id
  ORDER BY p.created_at DESC
`;

export async function GET(request: Request) {
  const db = await getDb();
  const url = new URL(request.url);
  const offset = Math.max(
    0,
    Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0,
  );
  const requestedLimit =
    Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20;
  const limit = Math.min(20, Math.max(1, requestedLimit));
  const papers = db.query(`${paperQuery} LIMIT ? OFFSET ?`).all(limit, offset);
  const total =
    db
      .query<{ count: number }, []>("SELECT COUNT(*) AS count FROM papers")
      .get()?.count ?? 0;
  return NextResponse.json({
    papers,
    total,
    offset,
    limit,
    hasMore: offset + papers.length < total,
  });
}

export async function POST(request: Request) {
  const db = await getDb();
  let body: {
    title?: string;
    description?: string;
    boardId?: number;
    classLevelId?: number;
    subjectId?: number;
    resourceTypeId?: number;
    examYear?: number;
    duration?: number;
    filePath?: string;
    fileSizeBytes?: number;
    board?: string;
    subject?: string;
    type?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  if (!body.boardId && body.board) {
    const board = db
      .query<{ id: number }, [string, string]>(
        "SELECT id FROM boards WHERE code = ? OR name = ?",
      )
      .get(body.board, body.board);
    if (board) body.boardId = board.id;
  }
  if (body.boardId && !body.classLevelId) {
    const level = db
      .query<{ id: number }, [number]>(
        "SELECT id FROM class_levels WHERE board_id = ? ORDER BY id LIMIT 1",
      )
      .get(body.boardId);
    body.classLevelId = level?.id;
  }
  if (body.classLevelId && !body.subjectId && body.subject) {
    const subject = db
      .query<{ id: number }, [number, string]>(
        "SELECT id FROM subjects WHERE class_level_id = ? AND name = ?",
      )
      .get(body.classLevelId, body.subject);
    body.subjectId = subject?.id;
  }
  if (body.boardId && !body.resourceTypeId) {
    const resourceType = db
      .query<{ id: number }, [number, string]>(
        "SELECT id FROM resource_types WHERE board_id = ? AND name = ?",
      )
      .get(body.boardId, body.type || "Exam paper");
    body.resourceTypeId = resourceType?.id;
  }
  if (
    !body.title?.trim() ||
    !body.boardId ||
    !body.classLevelId ||
    !body.subjectId ||
    !body.resourceTypeId ||
    !body.examYear
  ) {
    return NextResponse.json(
      { error: "Title, hierarchy metadata, and exam year are required." },
      { status: 400 },
    );
  }
  if (
    !Number.isInteger(body.examYear) ||
    body.examYear < 1900 ||
    (body.duration !== undefined &&
      (!Number.isInteger(body.duration) || body.duration <= 0)) ||
    (body.fileSizeBytes !== undefined &&
      (!Number.isInteger(body.fileSizeBytes) || body.fileSizeBytes < 0))
  ) {
    return NextResponse.json(
      {
        error:
          "Exam year, duration, and file size must be valid positive numbers.",
      },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  try {
    db.prepare(
      `INSERT INTO papers
       (id, title, description, duration, board_id, class_level_id, subject_id,
        resource_type_id, exam_year, file_path, file_size_bytes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      body.title.trim(),
      body.description?.trim() || null,
      body.duration || null,
      body.boardId,
      body.classLevelId,
      body.subjectId,
      body.resourceTypeId,
      body.examYear,
      body.filePath || "",
      body.fileSizeBytes || 0,
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Paper metadata does not match the selected board hierarchy." },
      { status: 400 },
    );
  }
}
