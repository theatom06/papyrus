import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteResourceType, updateResourceType } from "@/db/db-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
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
      { error: "Resource type name is required." },
      { status: 400 },
    );
  }
  const changed = await updateResourceType(Number(id), name);
  if (!changed) {
    return NextResponse.json(
      { error: "Resource type not found." },
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
  try {
    deleteResourceType(Number(id));
  } catch {
    return NextResponse.json(
      { error: "Resource type cannot be deleted while papers reference it." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
