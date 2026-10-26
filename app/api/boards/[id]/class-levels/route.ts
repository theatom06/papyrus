import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClassLevel } from "@/db/functions/board";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
  const boardId = Number(id);
  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Class level name is required." },
      { status: 400 },
    );
  }
  try {
    const created = await createClassLevel({ boardId, name });
    return NextResponse.json({ classLevel: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A class level with that name already exists." },
      { status: 409 },
    );
  }
}
