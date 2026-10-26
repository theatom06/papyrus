import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteSubject, updateSubject } from "@/db/functions/board";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
  let body: { name?: string; accent_color?: string };
  try {
    body = (await request.json()) as { name?: string; accent_color?: string };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const updates: { name?: string; accent_color?: string } = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.accent_color !== undefined) updates.accent_color = body.accent_color;
  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { error: "No changes supplied." },
      { status: 400 },
    );
  }
  const changed = await updateSubject(Number(id), updates);
  if (!changed) {
    return NextResponse.json({ error: "Subject not found." }, { status: 404 });
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
  try {
    deleteSubject(Number(id));
  } catch {
    return NextResponse.json(
      { error: "Subject cannot be deleted while papers reference it." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
