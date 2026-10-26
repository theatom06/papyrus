import { NextResponse } from "next/server";
import { updateReportStatus, deleteReport } from "@/db/functions/report";
import { requireAdmin } from "@/lib/admin-auth";
import log from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await context.params;
  const reportId = Number(id);
  if (!reportId) {
    return NextResponse.json({ error: "Invalid report ID." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const status = String(body.status || "");
  if (status !== "pending" && status !== "resolved" && status !== "dismissed") {
    return NextResponse.json(
      { error: "Status must be 'pending', 'resolved', or 'dismissed'." },
      { status: 400 },
    );
  }

  const updated = await updateReportStatus(reportId, status);
  if (!updated) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  await log("report.status_updated", { reportId, status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await context.params;
  const reportId = Number(id);
  if (!reportId) {
    return NextResponse.json({ error: "Invalid report ID." }, { status: 400 });
  }

  await deleteReport(reportId);
  await log("report.deleted", { reportId });
  return NextResponse.json({ ok: true });
}
