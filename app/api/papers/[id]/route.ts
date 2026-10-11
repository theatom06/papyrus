import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const db = await getDb();
  const { id } = await context.params;
  const paper = db
    .query(
      `SELECT p.id, p.title, p.description, p.exam_year AS year,
        p.duration, p.file_path, p.file_size_bytes, p.downloads_count AS downloads,
        p.is_verified, p.created_at, b.code AS board, s.name AS subject,
        rt.name AS type
       FROM papers p
       JOIN boards b ON b.id = p.board_id
       JOIN subjects s ON s.id = p.subject_id
       JOIN resource_types rt ON rt.id = p.resource_type_id
       WHERE p.id = ?`,
    )
    .get(id);
  if (!paper) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  }
  return NextResponse.json({ paper });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const db = await getDb();
  const { id } = await context.params;
  let body: {
    isVerified?: boolean;
    title?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (typeof body.isVerified === "boolean") {
    fields.push("is_verified = ?");
    values.push(body.isVerified ? 1 : 0);
  }
  if (body.title?.trim()) {
    fields.push("title = ?");
    values.push(body.title.trim());
  }
  if (!fields.length) {
    return NextResponse.json(
      { error: "No changes supplied." },
      { status: 400 },
    );
  }
  values.push(id);
  const result = db
    .prepare(`UPDATE papers SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  if (!result.changes) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const db = await getDb();
  const { id } = await context.params;
  const result = db.prepare("DELETE FROM papers WHERE id = ?").run(id);
  if (!result.changes) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
