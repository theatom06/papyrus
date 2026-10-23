"use client";

import { useState } from "react";
import { Flag, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "./modal";
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
    description:
      "The paper content doesn't match the listed subject or curriculum",
  },
  {
    value: "wrong_year",
    label: "Wrong exam year",
    description:
      "The listed year doesn't match the actual exam year on the paper",
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
          reason:
            REPORT_REASONS.find((r) => r.value === selected)?.label || selected,
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
      <Modal title="Report submitted" eyebrow="PAPYRUS" onClose={onClose}>
        <div className="success">
          <div>
            <CheckCircle2 size={40} color="#2f7c57" />
          </div>
          <h2>Thank you for reporting</h2>
          <p>
            Our moderation team will review your report and take action if
            needed. Your contribution helps keep the archive accurate and high
            quality.
          </p>
          <button
            className="button button-dark"
            onClick={onClose}
            style={{ marginTop: 18, width: "100%" }}
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
      eyebrow="PAPYRUS"
      onClose={onClose}
      variant="form"
    >
      <p
        style={{
          marginBottom: 16,
          fontSize: 12,
          color: "var(--slate)",
          lineHeight: 1.55,
        }}
      >
        Reporting: <strong style={{ color: "var(--ink)" }}>{paperTitle}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="report-reason-list">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason.value}
              className={`report-reason-option${selected === reason.value ? " selected" : ""}`}
            >
              <input
                type="radio"
                name="report-reason"
                value={reason.value}
                checked={selected === reason.value}
                onChange={() => setSelected(reason.value)}
              />
              <div className="reason-content">
                <strong>{reason.label}</strong>
                <span>{reason.description}</span>
              </div>
            </label>
          ))}
        </div>

        {selected === "other" && (
          <div style={{ marginTop: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--slate)",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Please describe the issue *
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what's wrong with this paper..."
              required={selected === "other"}
              style={{
                width: "100%",
                minHeight: 100,
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--sand)",
                color: "var(--ink)",
                font: "13px var(--sans)",
                lineHeight: 1.55,
                resize: "vertical",
                outline: 0,
              }}
            />
          </div>
        )}

        {selected && selected !== "other" && (
          <div style={{ marginTop: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--slate)",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Any extra context that might help..."
              style={{
                width: "100%",
                minHeight: 72,
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--sand)",
                color: "var(--ink)",
                font: "13px var(--sans)",
                lineHeight: 1.55,
                resize: "vertical",
                outline: 0,
              }}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--slate)",
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Your email (optional — for follow-up)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ margin: 0 }}
          />
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="button button-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={!selected || submitting}
            style={{ gap: 8 }}
          >
            <Flag size={14} />
            {submitting ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
