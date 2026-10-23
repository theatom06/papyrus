"use client";

import { UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";

export function FileDropzone({
  name,
  accept,
  required = false,
  onFileSelect,
}: {
  name: string;
  accept: string;
  required?: boolean;
  onFileSelect?: (file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  function selectFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const input = inputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    onFileSelect?.(file);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <button
      className={`file-dropzone${dragging ? " is-dragging" : ""}`}
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <UploadCloud size={22} aria-hidden="true" />
      <span>{fileName || "Drop a PDF here or choose a file"}</span>
      <small>{fileName ? "Ready to upload" : "PDF files only"}</small>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={(event) => selectFile(event.target.files?.[0])}
        tabIndex={-1}
      />
    </button>
  );
}
