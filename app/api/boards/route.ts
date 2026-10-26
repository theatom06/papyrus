import { NextResponse } from "next/server";
import log from "@/lib/admin-logger";
import serverLog from "@/lib/server-logger";
import { createBoard, getBoardOptions } from "@/db/functions/board";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await serverLog("boards.list", { method: "GET" });
  return NextResponse.json({ boards: await getBoardOptions() });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
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
  const name = body.name?.trim();
  const code = body.code?.trim().toUpperCase();
  if (!name || !code || !/^[A-Z0-9_-]{2,20}$/.test(code)) {
    return NextResponse.json(
      { error: "Board name and a valid code are required." },
      { status: 400 },
    );
  }
  try {
    const id = await createBoard({
      name,
      code,
      className: body.className?.trim() || "Grade 10",
      subjectName: body.subjectName?.trim() || "General Studies",
    });
    await log("board.created", { boardId: id, code });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A board with that name or code already exists." },
      { status: 409 },
    );
  }
}
