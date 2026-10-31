import { NextResponse } from "next/server";
import log from "@/lib/server-logger";
import { listPapers } from "@/db/functions/paper";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await log("papers.list", { method: "GET" });
  const url = new URL(request.url);
  const admin = url.searchParams.get("scope") === "admin";
  if (admin) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
  }
  const offset = Math.max(
    0,
    Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0,
  );
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(100, Math.max(1, Number.parseInt(limitParam, 10) || 20))
    : admin
      ? 500
      : 20;

  const query =
    url.searchParams.get("q") || url.searchParams.get("query") || undefined;
  const board = url.searchParams.get("board") || undefined;
  const boardId = url.searchParams.get("boardId")
    ? Number(url.searchParams.get("boardId"))
    : undefined;
  const classLevel = url.searchParams.get("classLevel") || undefined;
  const classLevelId = url.searchParams.get("classLevelId")
    ? Number(url.searchParams.get("classLevelId"))
    : undefined;
  const subject = url.searchParams.get("subject") || undefined;
  const subjectId = url.searchParams.get("subjectId")
    ? Number(url.searchParams.get("subjectId"))
    : undefined;
  const type = url.searchParams.get("type") || undefined;
  const year = url.searchParams.get("year") || undefined;
  const status = url.searchParams.get("status") || undefined;

  const result = await listPapers({
    admin,
    limit,
    offset,
    query,
    board,
    boardId,
    classLevel,
    classLevelId,
    subject,
    subjectId,
    type,
    year,
    status,
  });

  return NextResponse.json({
    ...result,
    offset,
    limit,
    hasMore: offset + result.papers.length < result.total,
  });
}
