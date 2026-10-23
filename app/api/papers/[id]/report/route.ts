import { NextResponse } from "next/server";
import { createPaperReport, getPaper } from "@/db/db-service";
import log from "@/lib/server-logger";
import { allowRequest } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request-info";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const address = clientAddress(request);

  // Rate limit: max 25 reports per 10 minutes per IP
  if (!allowRequest(`paper-report:${address}`, 25, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many reports submitted. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const paper = await getPaper(id, true);
  if (!paper) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
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

  const reason = String(body.reason || "").trim();
  const details = body.details ? String(body.details).trim() : null;
  const reporterEmail = body.reporterEmail
    ? String(body.reporterEmail).trim()
    : null;

  if (!reason) {
    return NextResponse.json(
      { error: "A reason for reporting is required." },
      { status: 400 },
    );
  }

  try {
    const report = await createPaperReport({
      paperId: id,
      reason,
      details,
      reporterEmail,
    });
    await log("paper.reported", { paperId: id, reason });
    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (error) {
    console.error("Failed to record paper report", error);
    return NextResponse.json(
      { error: "Unable to submit report. Please try again." },
      { status: 500 },
    );
  }
}
