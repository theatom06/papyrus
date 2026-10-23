"use client";

import { useEffect, useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "./toast";

function getOrCreateClientId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("papyrus-client-id");
    if (!id) {
      id = `cid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("papyrus-client-id", id);
    }
    return id;
  } catch {
    return `cid-fallback-${Date.now()}`;
  }
}

type VoteType = "up" | "down" | null;

export function VotingWidget({ paperId }: { paperId: string }) {
  const { showToast } = useToast();
  const [clientId, setClientId] = useState<string>("");
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<VoteType>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = getOrCreateClientId();
    setClientId(id);
  }, []);

  const fetchVotes = useCallback(
    async (activeClientId: string) => {
      if (!paperId) return;
      try {
        const data = await apiRequest<{
          upvotes: number;
          downvotes: number;
          userVote: string | null;
        }>(
          `/api/papers/${paperId}/vote?clientId=${encodeURIComponent(activeClientId || "")}`,
        );
        setUpvotes(data.upvotes ?? 0);
        setDownvotes(data.downvotes ?? 0);
        setUserVote((data.userVote as VoteType) || null);
      } catch {
        // silently fail — votes are non-critical
      } finally {
        setLoading(false);
      }
    },
    [paperId],
  );

  useEffect(() => {
    if (clientId) {
      fetchVotes(clientId);
    }
  }, [clientId, fetchVotes]);

  async function handleVote(vote: VoteType) {
    if (submitting) return;
    const activeClientId = clientId || getOrCreateClientId();
    if (!activeClientId) {
      showToast("Unable to initialize voter session.", "error");
      return;
    }

    // Toggle: if already same vote, remove it
    const nextVote: VoteType = userVote === vote ? null : vote;

    setSubmitting(true);
    // Optimistic update
    const prevUp = upvotes;
    const prevDown = downvotes;
    const prevVote = userVote;

    // Calculate new counts optimistically
    let newUp = upvotes;
    let newDown = downvotes;
    if (prevVote === "up") newUp--;
    if (prevVote === "down") newDown--;
    if (nextVote === "up") newUp++;
    if (nextVote === "down") newDown++;

    setUpvotes(Math.max(0, newUp));
    setDownvotes(Math.max(0, newDown));
    setUserVote(nextVote);

    try {
      const result = await apiRequest<{
        upvotes: number;
        downvotes: number;
        userVote: string | null;
      }>(`/api/papers/${paperId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: activeClientId, vote: nextVote }),
      });
      // Sync with server response
      setUpvotes(result.upvotes ?? Math.max(0, newUp));
      setDownvotes(result.downvotes ?? Math.max(0, newDown));
      setUserVote((result.userVote as VoteType) ?? nextVote);

      if (nextVote === "up")
        showToast("Thanks for voting this paper helpful!", "success");
      else if (nextVote === "down")
        showToast(
          "Feedback recorded. Thanks for keeping quality high.",
          "info",
        );
      else showToast("Vote removed.", "info");
    } catch (err) {
      // Rollback on error
      setUpvotes(prevUp);
      setDownvotes(prevDown);
      setUserVote(prevVote);
      showToast(
        err instanceof Error
          ? err.message
          : "Could not record your vote. Try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const totalVotes = upvotes + downvotes;
  const percentage =
    totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : null;

  return (
    <div
      className="vote-widget-container"
      role="group"
      aria-label="Rate this paper"
    >
      <div className="vote-widget-actions">
        <button
          type="button"
          className={`vote-card-btn vote-up${userVote === "up" ? " active" : ""}`}
          onClick={() => handleVote("up")}
          disabled={submitting}
          aria-pressed={userVote === "up"}
          title="Mark as helpful"
          aria-label={`Helpful (${upvotes})`}
        >
          <ThumbsUp size={14} />
          <span>Helpful</span>
          <span className="vote-count">{upvotes}</span>
        </button>

        <button
          type="button"
          className={`vote-card-btn vote-down${userVote === "down" ? " active" : ""}`}
          onClick={() => handleVote("down")}
          disabled={submitting}
          aria-pressed={userVote === "down"}
          title="Report issues or low quality"
          aria-label={`Has issues (${downvotes})`}
        >
          <ThumbsDown size={14} />
          <span>Issues</span>
          <span className="vote-count">{downvotes}</span>
        </button>
      </div>

      <div className="vote-widget-summary">
        {totalVotes > 0 ? (
          <span>
            {percentage}% student rating ({totalVotes}{" "}
            {totalVotes === 1 ? "vote" : "votes"})
          </span>
        ) : (
          <span>No ratings yet — be the first!</span>
        )}
      </div>
    </div>
  );
}
