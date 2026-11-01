export function calculateScore(
  upvotes: number,
  downvotes: number,
  downloads: number,
  createdAt: Date | string,
): number {
  const creationDate =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;

  const totalVotes = upvotes + downvotes;

  // Part 1: Wilson Lower Bound Score (Quality Baseline)
  // This gives a good baseline score that accounts for both the proportion of upvotes and the total number of votes.
  let qualityScore = 0.5;
  if (totalVotes > 0) {
    const z = 1.96; // 95% confidence level
    const p = upvotes / totalVotes;
    const left = p + (z * z) / (2 * totalVotes);
    const right =
      z * Math.sqrt((p * (1 - p) + (z * z) / (4 * totalVotes)) / totalVotes);
    const under = 1 + (z * z) / totalVotes;
    qualityScore = (left - right) / under;
  }

  // Part 2: Engagement Weight (Logarithmic diminishing returns scale)
  // This ensures that papers with more votes are rewarded, but the effect diminishes as the number of votes increases. It is sacaled down to ensure that the engagement multiplier does not overshadow the quality score.
  const engagementMultiplier = 0.15 * Math.log10(totalVotes + 1) + 0.1 * Math.log10(downloads + 1) + 1;

  // Part 3: Recency Buffer (Decays to 0 over 30 days)
  // This gives a small bonus to newer papers, encouraging fresh content to surface.
  const daysOld = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 1 - daysOld / 30) * 0.2;

  // Composite score calculation
  let finalScore = qualityScore * engagementMultiplier + recencyBonus;
  let MaxScore = 2.4; //Estimated from 50,000 upvote, 20 downvote, 50,000 download, 0 day old paper I mean i dont think so it will go over this
  // Normalize the final score to be between 0 and 1
  finalScore = Math.min(finalScore / MaxScore, 1);
  return finalScore;
}

