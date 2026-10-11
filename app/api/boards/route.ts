import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const boards = db
    .query(
      `SELECT b.id, b.name, b.code,
        COUNT(DISTINCT cl.id) AS class_count,
        COUNT(DISTINCT p.id) AS paper_count
       FROM boards b
       LEFT JOIN class_levels cl ON cl.board_id = b.id
       LEFT JOIN papers p ON p.board_id = b.id
       GROUP BY b.id
       ORDER BY b.name`,
    )
    .all();
  return NextResponse.json({ boards });
}

export async function POST(request: Request) {
  const db = await getDb();
  let body: {
    name?: string;
    code?: string;
    className?: string;
    subjectName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  if (!body.name?.trim() || !body.code?.trim()) {
    return NextResponse.json(
      { error: "Board name and code are required." },
      { status: 400 },
    );
  }
  if (!/^[A-Za-z0-9_-]{2,20}$/.test(body.code.trim())) {
    return NextResponse.json(
      {
        error:
          "Board code must be 2–20 letters, numbers, underscores, or hyphens.",
      },
      { status: 400 },
    );
  }

  try {
    const board = db
      .prepare("INSERT INTO boards (name, code) VALUES (?, ?)")
      .run(body.name.trim(), body.code.trim().toUpperCase());
    const boardId = Number(board.lastInsertRowid);
    const className = body.className?.trim() || "Grade 10";
    const classLevel = db
      .prepare(
        "INSERT INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)",
      )
      .run(boardId, className, className.toLowerCase().replace(/\s+/g, "-"));
    const subjectName = body.subjectName?.trim() || "General Studies";
    db.prepare(
      "INSERT INTO subjects (class_level_id, name, slug) VALUES (?, ?, ?)",
    ).run(
      Number(classLevel.lastInsertRowid),
      subjectName,
      subjectName.toLowerCase().replace(/\s+/g, "-"),
    );
    db.prepare("INSERT INTO resource_types (board_id, name) VALUES (?, ?)").run(
      boardId,
      "Exam paper",
    );
    return NextResponse.json({ id: boardId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A board with that name or code already exists." },
      { status: 409 },
    );
  }
}
