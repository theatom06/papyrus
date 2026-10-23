import { NextResponse } from "next/server";
import log from "@/lib/admin-logger";
import serverLog from "@/lib/server-logger";
import { getBoardOptions, updateBoard } from "@/db/db-service";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const boards = await getBoardOptions();
  const board = boards.find((b) => b.id === Number(id));
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }
  return NextResponse.json({ board });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
  await serverLog("board.updated_requested", { boardId: id });
  const body = (await request.json()) as { name?: string; code?: string };
  const name = body.name?.trim();
  const code = body.code?.trim().toUpperCase();
  if (!name || !code)
    return NextResponse.json(
      { error: "Board name and code are required." },
      { status: 400 },
    );
  try {
    const changed = await updateBoard(Number(id), name, code);
    if (!changed)
      return NextResponse.json({ error: "Board not found." }, { status: 404 });
    await log("board.updated", { boardId: Number(id), code });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "A board with that name or code already exists." },
      { status: 409 },
    );
  }
}
