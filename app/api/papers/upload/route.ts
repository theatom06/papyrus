import { NextResponse } from "next/server";
import log from "@/lib/server-logger";
import { createPaper, deletePaper, isPaperStatus } from "@/db/functions/paper";
import { createContributorSubmission } from "@/db/functions/submission";
import {
  hasValidPaperMetadata,
  resolvePaperMetadata,
} from "@/db/functions/helpers";
import { allowRequest } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request-info";
import {
  isPdfFile,
  MAX_UPLOAD_BODY_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload-validation";
import { uploadFile, type UploadDetails, deleteFile } from "@/db/hc-cdn";

const optionalString = (value: FormDataEntryValue | null) => 
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const numberOrUndefined = (value: FormDataEntryValue | null) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
};

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
      { error: "The PDF must be 20 MB or smaller." },
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

  const id = Bun.randomUUIDv7();

  let uploadedFile: UploadDetails = null as any;

  try {
    uploadedFile = await uploadFile(file, `${id}.pdf`);

    await createPaper(id, {
      title,
      description,
      duration,
      boardId: metadata.boardId,
      classLevelId: metadata.classLevelId,
      subjectId: metadata.subjectId,
      resourceTypeId: metadata.resourceTypeId,
      examYear,
      fileId: uploadedFile.id,
      fileName: uploadedFile.filename,
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
    if (uploadedFile) await deleteFile(uploadedFile.id);

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
      { error: "The paper could not be uploaded.", details: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
