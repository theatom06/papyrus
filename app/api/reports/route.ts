import { NextResponse } from "next/server";
import { listPaperReports } from "@/db/db-service";
import { requireAdmin } from "@/lib/admin-auth";
import log from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const paperId = url.searchParams.get("paperId") || undefined;

  const reports = await listPaperReports({ status, paperId });
  await log("reports.list", {
    count: reports.length,
    status: status ?? null,
    paperId: paperId ?? null,
  });
  return NextResponse.json({ reports });
}
