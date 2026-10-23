import { NextResponse } from "next/server";
import { getPaperVoteStatus, recordPaperVote, getPaper } from "@/db/db-service";
import log from "@/lib/server-logger";
import { allowRequest } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request-info";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId") || undefined;

  const status = await getPaperVoteStatus(id, clientId);
  return NextResponse.json(status);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const address = clientAddress(request);

  if (!allowRequest(`paper-vote:${address}`, 60, 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many voting requests. Please slow down." },
      { status: 429 },
    );
  }

  const paper = await getPaper(id, true);
  if (!paper) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const clientId = String(body.clientId || "").trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "Client identifier is required." },
      { status: 400 },
    );
  }

  const vote = body.vote;
  if (vote !== "up" && vote !== "down" && vote !== null) {
    return NextResponse.json(
      { error: "Vote must be 'up', 'down', or null." },
      { status: 400 },
    );
  }

  try {
    const result = await recordPaperVote({
      paperId: id,
      clientId,
      voteType: vote,
    });
    await log("paper.voted", { paperId: id, vote });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to record vote", error);
    return NextResponse.json(
      { error: "Failed to record vote." },
      { status: 500 },
    );
  }
}
