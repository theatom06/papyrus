import { NextResponse } from "next/server";
import log from "@/lib/admin-logger";
import serverLog from "@/lib/server-logger";
import {
  getPaper,
  isPaperStatus,
  softDeletePaper,
  updatePaper,
} from "@/db/db-service";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await serverLog("paper.requested", { paperId: id });
  const admin = new URL(request.url).searchParams.get("scope") === "admin";
  if (admin) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
  }
  const paper = await getPaper(id, admin);
  if (!paper)
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  return NextResponse.json({ paper });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const updates: Record<string, string | number> = {};
  if (typeof body.title === "string" && body.title.trim())
    updates.title = body.title.trim();
  if (typeof body.description === "string")
    updates.description = body.description.trim();
  if (Number.isInteger(body.duration) && Number(body.duration) > 0)
    updates.duration = Number(body.duration);
  if (Number.isInteger(body.examYear) && Number(body.examYear) >= 1900)
    updates.exam_year = Number(body.examYear);
  if (
    body.downloads !== undefined &&
    Number.isInteger(Number(body.downloads)) &&
    Number(body.downloads) >= 0
  ) {
    updates.downloads_count = Number(body.downloads);
  }
  for (const [input, column] of [
    ["boardId", "board_id"],
    ["classLevelId", "class_level_id"],
    ["subjectId", "subject_id"],
    ["resourceTypeId", "resource_type_id"],
  ] as const) {
    if (body[input] !== undefined) {
      if (!Number.isInteger(body[input]) || Number(body[input]) <= 0) {
        return NextResponse.json(
          { error: "Paper metadata is invalid." },
          { status: 400 },
        );
      }
      updates[column] = Number(body[input]);
    }
  }
  if (body.status !== undefined) {
    if (!isPaperStatus(body.status))
      return NextResponse.json(
        { error: "Invalid paper status." },
        { status: 400 },
      );
    updates.status = body.status;
  }
  if (!Object.keys(updates).length)
    return NextResponse.json(
      { error: "No changes supplied." },
      { status: 400 },
    );
  try {
    const changed = await updatePaper(id, updates);
    if (!changed)
      return NextResponse.json({ error: "Paper not found." }, { status: 404 });
    await log("paper.updated", {
      paperId: id,
      status: updates.status || null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update paper", error);
    return NextResponse.json(
      { error: "Paper could not be updated." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(_request);
  if (denied) return denied;
  const { id } = await context.params;
  const changed = await softDeletePaper(id);
  if (!changed)
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  await log("paper.soft_deleted", { paperId: id });
  return NextResponse.json({ ok: true });
}
