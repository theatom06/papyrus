"use client";

import { useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import Modal from "./modal";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "./toast";

type ReportReason =
  | "incorrect_content"
  | "wrong_year"
  | "poor_scan"
  | "duplicate"
  | "copyright"
  | "other";

const REPORT_REASONS: {
  value: ReportReason;
  label: string;
  description: string;
}[] = [
  {
    value: "incorrect_content",
    label: "Incorrect content",
    description: "The paper content doesn't match the listed subject or curriculum",
  },
  {
    value: "wrong_year",
    label: "Wrong exam year",
    description: "The listed year doesn't match the actual exam year on the paper",
  },
  {
    value: "poor_scan",
    label: "Poor scan quality",
    description: "The PDF is unreadable, blurry, or has missing pages",
  },
  {
    value: "duplicate",
    label: "Duplicate paper",
    description: "This paper already exists in the archive",
  },
  {
    value: "copyright",
    label: "Copyright concern",
    description: "This paper should not be publicly shared",
  },
  {
    value: "other",
    label: "Other issue",
    description: "Something else is wrong — please describe below",
  },
];

export function ReportPaperModal({
  paperId,
  paperTitle,
  onClose,
}: {
  paperId: string;
  paperTitle: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    setSubmitting(true);
    try {
      await apiRequest(`/api/papers/${paperId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: REPORT_REASONS.find((r) => r.value === selected)?.label || selected,
          details: details.trim() || null,
          reporterEmail: email.trim() || null,
        }),
      });
      setSubmitted(true);
      showToast("Your report has been submitted. Thank you!", "success");
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to submit report. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Modal title="Report submitted" eyebrow="REPORT COMPLETED" onClose={onClose}>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="mt-4 font-serif text-lg font-bold text-ink">Thank you for reporting</h2>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate">
            Our moderation team will review this report. Your help keeps the archive accurate and high quality.
          </p>
          <button
            className="mt-6 w-full rounded-md bg-ink px-4 py-2.5 text-xs font-semibold text-sand hover:opacity-90 cursor-pointer shadow-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Report a problem"
      eyebrow="FLAG ISSUE"
      onClose={onClose}
      variant="form"
    >
      <p className="mb-4 text-xs text-slate">
        Reporting: <strong className="text-ink font-semibold">{paperTitle}</strong>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason.value}
              className={`flex items-start gap-3 rounded-lg border p-3 text-xs cursor-pointer transition ${
                selected === reason.value
                  ? "border-amber bg-amber/10 text-ink shadow-2xs"
                  : "border-border-main bg-sand/30 text-slate hover:border-amber/50 hover:bg-sand/60"
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={reason.value}
                checked={selected === reason.value}
                onChange={() => setSelected(reason.value)}
                className="mt-0.5 accent-amber shrink-0 cursor-pointer"
              />
              <div className="flex flex-col gap-0.5">
                <strong className="text-ink font-semibold">{reason.label}</strong>
                <span className="text-[11px] leading-relaxed text-slate">{reason.description}</span>
              </div>
            </label>
          ))}
        </div>

        {selected && (
          <div>
            <label className="block text-xs font-semibold text-slate">
              {selected === "other" ? "Please describe the issue *" : "Additional details (optional)"}
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What seems to be wrong with this paper?"
                required={selected === "other"}
                rows={3}
                className="mt-1 block w-full rounded-md border border-border-main bg-sand p-2.5 text-xs text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
              />
            </label>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate">
            Your email (optional — for status updates)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="mt-1 block w-full rounded-md border border-border-main bg-sand px-3 py-2 text-xs text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-main/70 pt-3">
          <button
            type="button"
            className="rounded-md border border-border-main px-4 py-2 text-xs font-medium text-slate hover:text-ink cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selected || submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-dark transition disabled:opacity-50 cursor-pointer"
          >
            <Flag size={13} />
            {submitting ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ReportPaperModal;
