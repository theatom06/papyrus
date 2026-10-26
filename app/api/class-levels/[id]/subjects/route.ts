import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSubject } from "@/db/functions/board";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
  const classLevelId = Number(id);
  let body: { name?: string; accent_color?: string };
  try {
    body = (await request.json()) as { name?: string; accent_color?: string };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Subject name is required." },
      { status: 400 },
    );
  }
  const accent_color = body.accent_color?.trim() || undefined;
  try {
    const created = await createSubject({ classLevelId, name, accent_color });
    return NextResponse.json({ subject: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A subject with that name already exists." },
      { status: 409 },
    );
  }
}
