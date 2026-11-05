"use client";

import { useEffect, useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "./toast";
import { calculateScore } from "@/util/score";

function getOrCreateClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("papyrus-client-id");
  if (!id) {
    id = "client_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("papyrus-client-id", id);
  }
  return id;
}

type VoteType = "up" | "down" | null;

export function VotingWidget({
  paperId,
  downloads,
  createdAt,
}: {
  paperId: string;
  downloads: number;
  createdAt: string;
}) {
  const { showToast } = useToast();
  const [upvotes, setUpvotes] = useState<number>(0);
  const [downvotes, setDownvotes] = useState<number>(0);
  const [userVote, setUserVote] = useState<VoteType>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVoteState = useCallback(async () => {
    try {
      const clientId = getOrCreateClientId();
      const res = await apiRequest<{
        upvotes: number;
        downvotes: number;
        userVote: VoteType;
      }>(`/api/papers/${paperId}/vote?clientId=${encodeURIComponent(clientId)}`);
      setUpvotes(res.upvotes);
      setDownvotes(res.downvotes);
      setUserVote(res.userVote);
    } catch {
    }
  }, [paperId]);

  useEffect(() => {
    fetchVoteState();
  }, [fetchVoteState]);

  async function handleVote(type: "up" | "down") {
    if (submitting) return;
    setSubmitting(true);
    const clientId = getOrCreateClientId();

    const previousVote = userVote;
    const previousUp = upvotes;
    const previousDown = downvotes;

    if (userVote === type) {
      setUserVote(null);
      if (type === "up") setUpvotes((v) => Math.max(0, v - 1));
      else setDownvotes((v) => Math.max(0, v - 1));
    } else {
      setUserVote(type);
      if (type === "up") {
        setUpvotes((v) => v + 1);
        if (previousVote === "down") setDownvotes((v) => Math.max(0, v - 1));
      } else {
        setDownvotes((v) => v + 1);
        if (previousVote === "up") setUpvotes((v) => Math.max(0, v - 1));
      }
    }

    try {
      const res = await apiRequest<{
        upvotes: number;
        downvotes: number;
        userVote: VoteType;
      }>(`/api/papers/${paperId}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteType: type, clientId }),
      });
      setUpvotes(res.upvotes);
      setDownvotes(res.downvotes);
      setUserVote(res.userVote);
      showToast(
        res.userVote
          ? `Marked as ${type === "up" ? "helpful" : "having issues"}.`
          : "Vote removed.",
        "success",
      );
    } catch (err: unknown) {
      setUserVote(previousVote);
      setUpvotes(previousUp);
      setDownvotes(previousDown);
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
  const score = calculateScore(upvotes, downvotes, downloads, createdAt);

  return (
    <div className="w-full flex flex-col gap-2.5" role="group" aria-label="Rate this paper">
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
            userVote === "up"
              ? "border-emerald-600 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
              : "border-border-main bg-sand/60 text-ink hover:border-emerald-500 hover:text-emerald-600"
          }`}
          onClick={() => handleVote("up")}
          disabled={submitting}
          aria-pressed={userVote === "up"}
          title="Mark as helpful"
        >
          <ThumbsUp size={14} className={userVote === "up" ? "fill-current" : ""} />
          <span>Helpful</span>
          <span className="ml-1 rounded-full bg-border-main/50 px-1.5 py-0.2 font-mono text-[10px]">
            {upvotes}
          </span>
        </button>

        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
            userVote === "down"
              ? "border-rose-600 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
              : "border-border-main bg-sand/60 text-ink hover:border-rose-500 hover:text-rose-600"
          }`}
          onClick={() => handleVote("down")}
          disabled={submitting}
          aria-pressed={userVote === "down"}
          title="Report issues or low quality"
        >
          <ThumbsDown size={14} className={userVote === "down" ? "fill-current" : ""} />
          <span>Issues</span>
          <span className="ml-1 rounded-full bg-border-main/50 px-1.5 py-0.2 font-mono text-[10px]">
            {downvotes}
          </span>
        </button>
      </div>

      <div className="text-center font-mono text-[11px] text-slate">
        {totalVotes > 0 ? (
          <span>
            {(score * 100).toFixed(0)}% positive rating ({totalVotes} {totalVotes === 1 ? "review" : "reviews"})
          </span>
        ) : (
          <span>No ratings yet — be the first to rate!</span>
        )}
      </div>
    </div>
  );
}

export default VotingWidget;
