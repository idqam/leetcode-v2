// SM-2 spaced repetition + time-based modifier
//
// quality scale:
//   1 = Again (forgot completely) → reset interval to 1 day
//   3 = Hard  (got it but struggled)
//   4 = Good  (recalled with some effort)
//   5 = Easy  (recalled immediately)
//
// time modifier: compares actual minutes to expected minutes for that difficulty.
// If you took >50% longer than expected, the next interval shrinks.
// If you solved it in <50% of expected time, the interval grows slightly.

export type Quality = 1 | 3 | 4 | 5;

export const QUALITY_LABELS: Record<Quality, string> = {
  1: "Again",
  3: "Hard",
  4: "Good",
  5: "Easy",
};

// Rough expected solve-time per difficulty during a review (minutes)
const EXPECTED_MINUTES: Record<string, number> = {
  Easy: 8,
  Medium: 18,
  Hard: 30,
};

const MIN_EF = 1.3;
const MAX_INTERVAL_DAYS = 90;

export interface ReviewInput {
  reviewNumber: number;   // 1-based: which review session this is
  prevIntervalDays: number; // 0 for the very first review
  prevEF: number;           // 2.5 for the very first review
  quality: Quality;
  timeTaken: number | null; // actual minutes, or null if not recorded
  difficulty: string;       // "Easy" | "Medium" | "Hard"
}

export interface ReviewOutput {
  nextIntervalDays: number;
  newEF: number;
}

export function computeNextReview({
  reviewNumber,
  prevIntervalDays,
  prevEF,
  quality,
  timeTaken,
  difficulty,
}: ReviewInput): ReviewOutput {
  // EF update (SM-2 formula)
  let newEF = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(MIN_EF, newEF);

  let interval: number;

  if (quality === 1) {
    // Forgot — reset, also penalize EF
    interval = 1;
    newEF = Math.max(MIN_EF, prevEF - 0.2);
  } else if (reviewNumber === 1) {
    interval = quality >= 4 ? 3 : 1;
  } else if (reviewNumber === 2) {
    interval = quality >= 4 ? 7 : 3;
  } else {
    interval = Math.round(prevIntervalDays * newEF);
  }

  // Time modifier — only applied when quality >= 3
  if (quality >= 3 && timeTaken !== null) {
    const expected = EXPECTED_MINUTES[difficulty] ?? 20;
    const ratio = timeTaken / expected;

    if (ratio > 1.5) {
      // Took 50%+ longer than expected: shorten interval, nudge EF down
      interval = Math.round(interval * 0.75);
      newEF = Math.max(MIN_EF, newEF - 0.1);
    } else if (ratio < 0.5) {
      // Solved in under half the expected time: lengthen interval slightly
      interval = Math.round(interval * 1.1);
    }
  }

  interval = Math.min(MAX_INTERVAL_DAYS, Math.max(1, interval));
  return { nextIntervalDays: interval, newEF };
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
