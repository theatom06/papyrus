import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteClassLevel, updateClassLevel } from "@/db/db-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
  let body: { name?: string; slug?: string };
  try {
    body = (await request.json()) as { name?: string; slug?: string };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const updates: { name?: string; slug?: string } = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.slug !== undefined) updates.slug = body.slug.trim();
  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { error: "No changes supplied." },
      { status: 400 },
    );
  }
  const changed = await updateClassLevel(Number(id), updates);
  if (!changed) {
    return NextResponse.json(
      { error: "Class level not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(_request);
  if (denied) return denied;
  const { id } = await context.params;
  deleteClassLevel(Number(id));
  return NextResponse.json({ ok: true });
}
