import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; code?: string };
  if (!body.name?.trim() || !body.code?.trim()) {
    return NextResponse.json({ error: "Board name and code are required." }, { status: 400 });
  }
  try {
    const result = db.prepare("UPDATE boards SET name = ?, code = ? WHERE id = ?").run(body.name.trim(), body.code.trim().toUpperCase(), Number(id));
    if (!result.changes) return NextResponse.json({ error: "Board not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "A board with that name or code already exists." }, { status: 409 });
  }
}
