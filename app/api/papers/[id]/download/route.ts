import { NextResponse } from "next/server";
import { getPaper } from "@/db/functions/paper";
import { incrementDownloads } from "@/db/functions/helpers";
import log from "@/lib/server-logger";
import { requireAdmin } from "@/lib/admin-auth";
import { getFileUrl } from "@/db/hc-cdn";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await log("paper.download_requested", { paperId: id });

  const admin = new URL(request.url).searchParams.get("scope") === "admin";

  if (admin) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
  }

  const paper = (await getPaper(id, admin)) as {
    file_id?: string;
    file_name?: string;
    title?: string;
  } | null;

  if (!paper?.file_id || !paper?.file_name)
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  try {
    const fileUrl = await getFileUrl(paper.file_id, paper.file_name);
    await incrementDownloads(id);
    
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    await log("paper.download_failed", {
      paperId: id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Paper file is unavailable." },
      { status: 404 },
    );
  }
}