/** Normalized edit-distance similarity between two strings, 0 (nothing alike) to 1 (identical). */
function similarity(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return m === n ? 1 : 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return 1 - dp[m][n] / Math.max(m, n);
}

/**
 * True if every word in `query` fuzzily matches some word in `target` —
 * tolerates typos like "iphoen" for "iphone". Numeric tokens (model numbers
 * like "17" or "14") must match exactly, so "iphone 17" never fuzzy-matches
 * "iphone 14" just because the strings are similar.
 */
export function fuzzyMatches(query: string, target: string, threshold = 0.6): boolean {
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return false;
  const targetWords = target.toLowerCase().split(/\s+/).filter(Boolean);

  return queryWords.every((qw) => {
    if (/^\d+$/.test(qw)) {
      return targetWords.includes(qw);
    }
    return targetWords.some((tw) => tw.includes(qw) || similarity(qw, tw) >= threshold);
  });
}

/** Rough relevance score for sorting search results — higher is more relevant. */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 100 - t.indexOf(q);

  const queryWords = q.split(/\s+/).filter(Boolean);
  const targetWords = t.split(/\s+/).filter(Boolean);

  let score = 0;
  for (const qw of queryWords) {
    let best = 0;
    for (const tw of targetWords) {
      if (tw === qw) best = Math.max(best, 3);
      else if (tw.includes(qw)) best = Math.max(best, 2);
      else if (!/^\d+$/.test(qw)) best = Math.max(best, similarity(qw, tw) * 1.5);
    }
    score += best;
  }
  return score;
}