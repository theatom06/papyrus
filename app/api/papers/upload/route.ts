import { NextResponse } from "next/server";
import log from "@/lib/server-logger";
import { createPaper, deletePaper, isPaperStatus } from "@/db/functions/paper";
import { createContributorSubmission } from "@/db/functions/submission";
import { validateRequest, cleanForm, type UploadForm } from "./upload-validation";
import { uploadFile, type UploadDetails, deleteFile } from "@/db/hc-cdn";


export async function POST(request: Request) {
  const validationResponse = await validateRequest(request);

  if (validationResponse) {
    return validationResponse;
  }

  let form: UploadForm;

  try {
    form = await cleanForm(await request.formData());
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const parsedStatus = error instanceof Error ? Number(error.name) : NaN;

    return NextResponse.json(
      { error: message },
      { status: Number.isInteger(parsedStatus) ? parsedStatus : 400 },
    );
  }

  const {
    title,
    contributorEmail,
    description,
    contributorComments,
    examYear,
    duration,
    file,
    boardId,
    classLevelId,
    subjectId,
    resourceTypeId,
  } = form;

  const statusValue = "review";
  if (!isPaperStatus(statusValue)) {
    return NextResponse.json(
      { error: "Invalid paper status." },
      { status: 400 },
    );
  }

  const id = Bun.randomUUIDv7("base64url");

  let uploadedFile: UploadDetails = null as any;

  try {
    uploadedFile = await uploadFile(file, `${id}.pdf`);

    await createPaper(id, {
      title,
      description,
      duration,
      boardId,
      classLevelId,
      subjectId,
      resourceTypeId,
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
      {
        error: "The paper could not be uploaded.",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
