import { getDb } from "../db";
import { type SQLQueryBindings } from "bun:sqlite";

export async function recordVote(input: {
  paperId: string;
  clientId: string;
  voteType: "up" | "down" | null;
}) {
  const db = await getDb();
  const existing = db
    .query<{ id: number; vote_type: string }, SQLQueryBindings[]>(
      "SELECT id, vote_type FROM paper_votes WHERE paper_id = ? AND client_id = ?",
    )
    .get(input.paperId, input.clientId);

  if (input.voteType === null) {
    if (existing) {
      db.prepare("DELETE FROM paper_votes WHERE id = ?").run(existing.id);
    }
  } else if (!existing) {
    db.prepare(
      "INSERT INTO paper_votes (paper_id, vote_type, client_id) VALUES (?, ?, ?)",
    ).run(input.paperId, input.voteType, input.clientId);
  } else if (existing.vote_type !== input.voteType) {
    db.prepare("UPDATE paper_votes SET vote_type = ? WHERE id = ?").run(
      input.voteType,
      existing.id,
    );
  }

  const counts = db
    .query<{ up: number; down: number }, SQLQueryBindings[]>(
      `
    SELECT
      COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) AS up,
      COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) AS down
    FROM paper_votes WHERE paper_id = ?
  `,
    )
    .get(input.paperId) || { up: 0, down: 0 };

  db.prepare(
    "UPDATE papers SET upvotes_count = ?, downvotes_count = ? WHERE id = ?",
  ).run(counts.up, counts.down, input.paperId);

  return {
    upvotes: counts.up,
    downvotes: counts.down,
    userVote: input.voteType,
  };
}

export async function getVoteStatus(paperId: string, clientId?: string) {
  const db = await getDb();
  const counts = db
    .query<
      { upvotes_count: number; downvotes_count: number },
      SQLQueryBindings[]
    >("SELECT upvotes_count, downvotes_count FROM papers WHERE id = ?")
    .get(paperId);
  let userVote: string | null = null;
  if (clientId) {
    const v = db
      .query<{ vote_type: string }, SQLQueryBindings[]>(
        "SELECT vote_type FROM paper_votes WHERE paper_id = ? AND client_id = ?",
      )
      .get(paperId, clientId);
    if (v) userVote = v.vote_type;
  }
  return {
    upvotes: counts?.upvotes_count ?? 0,
    downvotes: counts?.downvotes_count ?? 0,
    userVote,
  };
}
