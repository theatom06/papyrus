"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout";
import PageHeading from "@/components/page-heading";
import FileDropzone from "@/components/file-dropzone";
import { apiRequest } from "@/lib/api-client";
import Dropdown from "@/components/dropdown";
import PdfViewer from "@/components/pdf-viewer";
import { useToast } from "@/components/toast";

type BoardOption = {
  id: number;
  name: string;
  code: string;
  classLevels: Array<{ id: number; name: string }>;
  subjects: Array<{ id: number; name: string; class_level_id: number }>;
  types: Array<{ id: number; name: string }>;
};

const CUSTOM = "__custom";

export function UploadPage() {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [boardValue, setBoardValue] = useState("");
  const [classValue, setClassValue] = useState("");
  const [subjectValue, setSubjectValue] = useState("");
  const [typeValue, setTypeValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    apiRequest<{ boards?: BoardOption[] }>("/api/boards")
      .then((data) => {
        setBoards(data.boards || []);
      })
      .catch(() =>
        setCatalogError(
          "We could not load the catalogue. Please refresh and try again.",
        ),
      );
  }, []);

  const board = boards.find((item) => String(item.id) === boardValue);
  const classLevels = board?.classLevels || [];
  const subjects = useMemo(
    () =>
      (board?.subjects || []).filter(
        (item) =>
          Boolean(classValue) &&
          classValue !== CUSTOM &&
          item.class_level_id === Number(classValue),
      ),
    [board, classValue],
  );
  const types = board?.types || [];

  function resetDependentFields() {
    setClassValue("");
    setSubjectValue("");
    setTypeValue("");
  }

  return (
    <Layout>
      <main className="min-h-screen bg-sand text-ink">
        <section className="mx-auto w-full max-w-270 px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
          <PageHeading
            className="mx-0! max-w-155! px-0! pb-6! pt-0!"
            kicker="COMMUNITY CONTRIBUTION"
            title="Put something"
            star="good back."
            description="Share a paper, guide, or note that made a difference to your prep."
          />
          {submitted ? (
            <section className="rounded-xl border border-border-main bg-linen p-6 text-center">
              <div className="text-amber-500">✓</div>
              <h2 className="mt-3 font-serif text-xl">
                Thank you for contributing.
              </h2>
              <p className="mt-2 text-sm text-slate">
                Your resource has joined the moderation queue.
              </p>
              <Link className="inline-flex items-center gap-2 rounded-md border border-border-main bg-sand px-4 py-2 text-sm font-medium text-ink transition hover:border-amber hover:text-amber" href="/archive">
                Return to archive
              </Link>
            </section>
          ) : (
            <section className="rounded-xl border border-border-main bg-linen p-4 sm:p-5">
              <form
                className="grid gap-x-3 gap-y-4 md:grid-cols-2 [&>label]:text-[9px] [&>label]:font-mono [&>label]:uppercase [&>label]:tracking-wide [&>label]:text-slate [&_input:not([type=hidden])]:mt-2 [&_input:not([type=hidden])]:w-full [&_input:not([type=hidden])]:rounded-md [&_input:not([type=hidden])]:border [&_input:not([type=hidden])]:border-border-main [&_input:not([type=hidden])]:bg-sand [&_input:not([type=hidden])]:px-3 [&_input:not([type=hidden])]:py-2.5 [&_input:not([type=hidden])]:font-sans [&_input:not([type=hidden])]:text-[10px] [&_input:not([type=hidden])]:uppercase [&_input:not([type=hidden])]:text-ink [&_input:not([type=hidden])]:outline-none [&_input:not([type=hidden])]:focus:border-amber [&_textarea]:mt-2 [&_textarea]:min-h-20 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-border-main [&_textarea]:bg-sand [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:font-sans [&_textarea]:text-[10px] [&_textarea]:text-ink [&_textarea]:outline-none [&_textarea]:focus:border-amber [&_small]:mt-1 [&_small]:block [&_small]:font-sans [&_small]:text-[8px] [&_small]:normal-case [&_small]:tracking-normal [&_small]:text-slate"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (submitting) return;
                  setError("");
                  setSubmitting(true);
                  const form = new FormData(event.currentTarget);
                  if (boardValue !== CUSTOM) form.set("boardId", boardValue);
                  if (classValue !== CUSTOM && classValue)
                    form.set("classLevelId", classValue);
                  if (subjectValue !== CUSTOM && subjectValue)
                    form.set("subjectId", subjectValue);
                  if (typeValue !== CUSTOM && typeValue)
                    form.set("resourceTypeId", typeValue);
                  if (boardValue === CUSTOM)
                    form.set("board", String(form.get("customBoard") || ""));
                  if (classValue === CUSTOM)
                    form.set(
                      "classLevel",
                      String(form.get("customClassLevel") || ""),
                    );
                  if (subjectValue === CUSTOM)
                    form.set(
                      "subject",
                      String(form.get("customSubject") || ""),
                    );
                  if (typeValue === CUSTOM)
                    form.set("type", String(form.get("customType") || ""));
                  try {
                    await apiRequest("/api/papers/upload", {
                      method: "POST",
                      body: form,
                    });
                    setSubmitted(true);
                    showToast(
                      "Paper submitted successfully for moderation!",
                      "success",
                    );
                  } catch (reason) {
                    const msg =
                      reason instanceof Error
                        ? reason.message
                        : "Upload failed. Please try again.";
                    setError(msg);
                    showToast(msg, "error");
                  } finally {
                    setSubmitting(false);
                  }

                }}
              >
                <label className="md:col-span-2">
                  Contact email
                  <input
                    name="contributorEmail"
                    type="email"
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <small>Admins may contact you about this submission.</small>
                </label>
                <label className="md:col-span-2">
                  Paper title
                  <input
                    name="title"
                    required
                    placeholder="e.g. Physics — Paper 2"
                  />
                </label>
                <label>
                  Board
                  <Dropdown
                    name="boardChoice"
                    required
                    value={boardValue}
                    onChange={(value) => {
                      setBoardValue(value);
                      resetDependentFields();
                    }}
                    placeholder="Choose a board"
                    options={[
                      ...boards.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                        meta: item.code,
                      })),
                      { value: CUSTOM, label: "Not listed" },
                    ]}
                  />
                </label>
                {boardValue === CUSTOM && (
                  <div className="col-span-2">
                    <label>
                      Custom board
                      <input
                        name="customBoard"
                        required
                        placeholder="Board name"
                      />
                    </label>
                  </div>
                )}
                <label>
                  Class or level
                  <Dropdown
                    name="classChoice"
                    required
                    value={classValue}
                    onChange={(value) => {
                      setClassValue(value);
                      setSubjectValue("");
                    }}
                    placeholder="Choose a class or level"
                    options={[
                      ...classLevels.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      })),
                      { value: CUSTOM, label: "Not listed" },
                    ]}
                  />
                </label>
                {classValue === CUSTOM && (
                  <div className="col-span-2">
                    <label>
                      Custom class or level
                      <input
                        name="customClassLevel"
                        required
                        placeholder="e.g. Grade 11"
                      />
                    </label>
                  </div>
                )}
                <label>
                  Subject
                  <Dropdown
                    name="subjectChoice"
                    required
                    value={subjectValue}
                    onChange={setSubjectValue}
                    placeholder="Choose a subject"
                    options={[
                      ...subjects.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      })),
                      { value: CUSTOM, label: "Not listed" },
                    ]}
                  />
                </label>
                {subjectValue === CUSTOM && (
                  <div className="col-span-2">
                    <label>
                      Custom subject
                      <input
                        name="customSubject"
                        required
                        placeholder="Subject name"
                      />
                    </label>
                  </div>
                )}
                <label>
                  Resource type
                  <Dropdown
                    name="typeChoice"
                    required
                    value={typeValue}
                    onChange={setTypeValue}
                    placeholder="Choose a resource type"
                    options={[
                      ...types.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      })),
                      { value: CUSTOM, label: "Not listed" },
                    ]}
                  />
                </label>
                {typeValue === CUSTOM && (
                  <div className="col-span-2">
                    <label>
                      Custom resource type
                      <input
                        name="customType"
                        required
                        placeholder="e.g. Mark scheme"
                      />
                    </label>
                  </div>
                )}
                <label>
                  Exam year
                  <input
                    name="examYear"
                    type="number"
                    min="1900"
                    required
                    defaultValue="2026"
                  />
                </label>
                <label>
                  Reading time in minutes
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    placeholder="60"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="description"
                    placeholder="What will students find here?"
                  />
                </label>
                <label>
                  Comments for admins
                  <textarea
                    name="contributorComments"
                    placeholder="Anything the moderators should know about this resource?"
                  />
                </label>
                <label>
                  Choose a file
                  <FileDropzone
                    name="file"
                    accept="application/pdf"
                    required
                    onFileSelect={(file) => setSelectedFile(file || null)}
                  />
                </label>
                {selectedFile && (
                  <div className="md:col-span-2 my-2 mb-5">
                    <PdfViewer file={selectedFile} title={selectedFile.name} />
                  </div>
                )}
                {catalogError && (
                  <p className="md:col-span-2 border border-red-900 bg-red-950/40 px-2 py-2 text-[9px] text-red-400">
                    {catalogError}
                  </p>
                )}
                {error && (
                  <p
                    className="md:col-span-2 border border-red-900 bg-red-950/40 px-2 py-2 text-[9px] text-red-400"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
                <button
                  className="md:col-span-2 w-full rounded-md bg-amber px-3 py-2 text-[9px] font-medium text-white transition-colors hover:bg-amber-dark disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={submitting || Boolean(catalogError)}
                >
                  {submitting ? "Uploading…" : "Submit resource →"}
                </button>
                {submitting && <p role="status">Uploading your PDF…</p>}
              </form>
            </section>
          )}
        </section>
      </main>
    </Layout>
  );
}

export default UploadPage;
