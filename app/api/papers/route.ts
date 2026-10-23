import { NextResponse } from "next/server";
import log from "@/lib/server-logger";
import {
  createPaper,
  createContributorSubmission,
  deletePaper,
  hasValidPaperMetadata,
  isPaperStatus,
  listPapers,
  resolvePaperMetadata,
} from "@/db/db-service";
import { savePaperFile, removePaperFile } from "@/db/file-storage";
import { allowRequest } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request-info";
import {
  isPdfFile,
  MAX_UPLOAD_BODY_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload-validation";
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

export async function POST(request: Request) {
  const address = clientAddress(request);
  if (!allowRequest(`paper-upload:${address}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Upload limit reached. Please try again later." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_UPLOAD_BODY_BYTES) {
    return NextResponse.json(
      { error: "Upload request is too large." },
      { status: 413 },
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Upload must use multipart/form-data." },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error:
          "The upload request was incomplete or exceeded the request limit.",
      },
      { status: 413 },
    );
  }

  const title = String(form.get("title") || "").trim();
  const contributorEmail = String(form.get("contributorEmail") || "").trim();
  const description = String(form.get("description") || "").trim();
  const contributorComments = String(
    form.get("contributorComments") || "",
  ).trim();
  const examYear = Number(form.get("examYear"));
  const durationValue = String(form.get("duration") || "");
  const duration = durationValue ? Number(durationValue) : null;
  const file = form.get("file");
  const metadata = await resolvePaperMetadata({
    boardId: numberOrUndefined(form.get("boardId")),
    classLevelId: numberOrUndefined(form.get("classLevelId")),
    subjectId: numberOrUndefined(form.get("subjectId")),
    resourceTypeId: numberOrUndefined(form.get("resourceTypeId")),
    board: optionalString(form.get("board")),
    classLevel: optionalString(form.get("classLevel")),
    subject: optionalString(form.get("subject")),
    type: optionalString(form.get("type")),
  });

  if (
    !title ||
    !metadata.boardId ||
    !metadata.classLevelId ||
    !metadata.subjectId ||
    !metadata.resourceTypeId ||
    !Number.isInteger(examYear) ||
    examYear < 1900
  ) {
    return NextResponse.json(
      { error: "Title, hierarchy metadata, and exam year are required." },
      { status: 400 },
    );
  }

  if (
    !(await hasValidPaperMetadata({
      boardId: metadata.boardId,
      classLevelId: metadata.classLevelId,
      subjectId: metadata.subjectId,
      resourceTypeId: metadata.resourceTypeId,
    }))
  ) {
    return NextResponse.json(
      {
        error:
          "The selected catalogue options do not belong together. Please reload and choose the fields again.",
      },
      { status: 400 },
    );
  }

  if (
    !contributorEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contributorEmail)
  ) {
    return NextResponse.json(
      { error: "A valid contact email address is required." },
      { status: 400 },
    );
  }

  if (duration !== null && (!Number.isInteger(duration) || duration <= 0)) {
    return NextResponse.json(
      { error: "Duration must be a positive whole number." },
      { status: 400 },
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "A PDF file is required." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "The PDF must be 10 MB or smaller." },
      { status: 413 },
    );
  }

  if (!(await isPdfFile(file))) {
    return NextResponse.json(
      { error: "Only PDF files are supported." },
      { status: 415 },
    );
  }

  const statusValue = "review";
  if (!isPaperStatus(statusValue)) {
    return NextResponse.json(
      { error: "Invalid paper status." },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  let storedPath: string | undefined;

  try {
    storedPath = await savePaperFile(id, file);
    await createPaper(id, {
      title,
      description,
      duration,
      boardId: metadata.boardId,
      classLevelId: metadata.classLevelId,
      subjectId: metadata.subjectId,
      resourceTypeId: metadata.resourceTypeId,
      examYear,
      filePath: storedPath,
      fileSizeBytes: file.size,
      status: statusValue,
    });

    await createContributorSubmission(
      id,
      contributorEmail,
      contributorComments,
    );

    await log("paper.created", {
      paperId: id,
      title,
      status: statusValue,
      fileName: file.name,
      contributorEmail,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (storedPath) await removePaperFile(storedPath);

    await deletePaper(id);

    await log("paper.upload_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    if (error instanceof Error && error.message.includes("FOREIGN KEY")) {
      return NextResponse.json(
        {
          error:
            "The selected board, class, subject, or resource type is no longer valid. Please reload the upload page and choose them again.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "The paper could not be uploaded." },
      { status: 500 },
    );
  }
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberOrUndefined(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}
