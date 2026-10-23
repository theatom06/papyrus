"use client";

import "./style.css";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout";
import { PageHeading } from "@/components/page-heading";
import { SettingsCard } from "@/app/settings/components/settings-card";
import { FileDropzone } from "@/components/file-dropzone";
import { PageTitle } from "@/components/page-title";
import { apiRequest } from "@/lib/api-client";
import { Dropdown } from "@/components/dropdown";
import { PdfViewer } from "@/components/pdf-viewer";
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

export default function UploadPage() {
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
        const nextBoards = data.boards || [];
        setBoards(nextBoards);
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
      <PageTitle title="Upload" />
      <main className="upload">
        <PageHeading
          kicker="COMMUNITY CONTRIBUTION"
          title={
            <>
              Put something
              <br />
              <em>good back.</em>
            </>
          }
          description="Share a paper, guide, or note that made a difference to your prep."
        />
        {submitted ? (
          <SettingsCard className="success">
            <div>✓</div>
            <h2>Thank you for contributing.</h2>
            <p>Your resource has joined the moderation queue.</p>
            <Link className="button button-soft" href="/archive">
              Return to archive
            </Link>
          </SettingsCard>
        ) : (
          <SettingsCard>
            <form
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
                  form.set("subject", String(form.get("customSubject") || ""));
                if (typeValue === CUSTOM)
                  form.set("type", String(form.get("customType") || ""));
                try {
                  await apiRequest("/api/papers", {
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
              <label>
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
              <label>
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
                <div className="custom-field">
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
                <div className="custom-field">
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
                <div className="custom-field">
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
                <div className="custom-field">
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
                <input name="duration" type="number" min="1" placeholder="60" />
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
                <div style={{ gridColumn: "1 / -1", margin: "10px 0 20px" }}>
                  <PdfViewer file={selectedFile} title={selectedFile.name} />
                </div>
              )}
              {catalogError && <p className="upload-error">{catalogError}</p>}
              {error && (
                <p className="upload-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button button-dark"
                type="submit"
                disabled={submitting || Boolean(catalogError)}
              >
                {submitting ? "Uploading…" : "Submit resource →"}
              </button>
              {submitting && <p role="status">Uploading your PDF…</p>}
            </form>
          </SettingsCard>
        )}
      </main>
    </Layout>
  );
}
