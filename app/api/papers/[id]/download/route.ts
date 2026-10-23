import { NextResponse } from "next/server";
import { getPaper, incrementDownloads } from "@/db/db-service";
import { readPaperFile } from "@/db/file-storage";
import log from "@/lib/server-logger";
import { requireAdmin } from "@/lib/admin-auth";
 
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
    file_path?: string;
    title?: string;
  } | null;

  if (!paper?.file_path)
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  try {
    const content = await readPaperFile(paper.file_path);
    if (!new URL(request.url).searchParams.has("preview")) {
      await incrementDownloads(id);
    }
    return new Response(content, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${new URL(request.url).searchParams.has("preview") ? "inline" : "attachment"}; filename="${safeFileName(paper.title || id)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
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

function safeFileName(value: string) {
  return (
    value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "paper"
  );
}
