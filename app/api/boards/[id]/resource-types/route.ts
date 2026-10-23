import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createResourceType } from "@/db/db-service";

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
      { error: "Resource type name is required." },
      { status: 400 },
    );
  }
  try {
    const created = await createResourceType({ boardId, name });
    return NextResponse.json({ resourceType: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A resource type with that name already exists." },
      { status: 409 },
    );
  }
}
