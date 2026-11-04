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
      className={`flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-5 py-8 text-center transition cursor-pointer ${
        dragging
          ? "border-amber bg-amber/10 text-amber"
          : "border-border-main bg-linen/50 text-slate hover:border-amber hover:text-amber"
      }`}
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
      <UploadCloud size={28} className={fileName ? "text-amber" : "text-slate"} aria-hidden="true" />
      <span className="text-sm font-medium text-ink">
        {fileName || "Drag & drop a PDF here, or click to browse"}
      </span>
      <span className="text-xs text-slate">
        {fileName ? "Ready to upload" : "PDF files up to 25MB supported"}
      </span>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={(event) => selectFile(event.target.files?.[0])}
        className="hidden"
      />
    </button>
  );
}

export default FileDropzone;
