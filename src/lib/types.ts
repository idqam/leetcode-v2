export type Difficulty = "Easy" | "Medium" | "Hard";
export type ReviewSlot = 1 | 2 | 3 | 4 | 5;

export const INTERVALS = [1, 3, 7, 14, 30] as const;

export function reviewDates(solvedAt: string): string[] {
  const base = new Date(solvedAt);
  return INTERVALS.map((days) => {
    const d = new Date(base.getTime() + days * 86_400_000);
    return d.toISOString().split("T")[0];
  });
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}
