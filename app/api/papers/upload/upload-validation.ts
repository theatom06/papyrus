import { NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request-info";
import {
  resolvePaperMetadata,
  hasValidPaperMetadata,
} from "@/db/functions/helpers";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BODY_BYTES = 22 * 1024 * 1024;

const optionalString = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const numberOrUndefined = (value: FormDataEntryValue | null) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
};

export async function validateRequest(
  request: Request,
): Promise<NextResponse | void> {
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
}

export type UploadForm = {
  title: string;
  contributorEmail: string;
  description: string;
  contributorComments: string;
  examYear: number;
  duration: number;
  file: File;
  boardId: number;
  classLevelId: number;
  subjectId: number;
  resourceTypeId: number;
};

export async function cleanForm(form: FormData): Promise<UploadForm> {
  const title = String(form.get("title") || "").trim();
  const contributorEmail = String(form.get("contributorEmail") || "").trim();
  const description = String(form.get("description") || "").trim();
  const contributorComments = String(
    form.get("contributorComments") || "",
  ).trim();
  const examYear = Number(form.get("examYear"));
  const durationValue = String(form.get("duration") || "");
  const duration = durationValue ? Number(durationValue) : 0;
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
    throw new Error("400", {
      cause: "Title, hierarchy metadata, and exam year are required.",
    });
  }

  if (
    !(await hasValidPaperMetadata({
      boardId: metadata.boardId,
      classLevelId: metadata.classLevelId,
      subjectId: metadata.subjectId,
      resourceTypeId: metadata.resourceTypeId,
    }))
  ) {
    throw new Error("400", {
      cause:
        "The selected catalogue options do not belong together. Please reload and choose the fields again.",
    });
  }

  if (
    !contributorEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contributorEmail)
  ) {
    throw new Error("400", {
      cause: "A valid contact email address is required.",
    });
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error("400", {
      cause: "Duration must be a positive whole number.",
    });
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("400", { cause: "A PDF file is required." });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("400", {
      cause: "File size exceeds the maximum allowed limit of 20 MB.",
    });
  }

  if (
    file.type !== "application/pdf" ||
    !file.name.toLowerCase().endsWith(".pdf") ||
    !new TextDecoder()
      .decode(await file.slice(0, 5).arrayBuffer())
      .startsWith("%PDF-")
  ) {
    throw new Error("415", { cause: "Only PDF files are allowed." });
  }

  return {
    title,
    contributorEmail,
    description,
    contributorComments,
    examYear,
    duration,
    file,
    boardId: metadata.boardId,
    classLevelId: metadata.classLevelId,
    subjectId: metadata.subjectId,
    resourceTypeId: metadata.resourceTypeId,
  };
}
