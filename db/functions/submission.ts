import { getDb } from "../db";

export async function createContributorSubmission(
  paperId: string,
  email: string,
  comments: string,
) {
  const db = await getDb();
  db.prepare(
    "INSERT INTO contributor_submissions (paper_id, contributor_email, comments) VALUES (?, ?, ?)",
  ).run(paperId, email, comments || null);
}

export async function deleteContributorSubmission(paperId: string) {
  const db = await getDb();
  db.prepare("DELETE FROM contributor_submissions WHERE paper_id = ?").run(
    paperId,
  );
}