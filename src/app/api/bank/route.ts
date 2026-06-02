import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { problems, solves, reviews } from "@/db/schema";
import { today } from "@/lib/types";
import { addDays } from "@/lib/algo";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const todayStr = today();

  const allSolves = await db.select().from(solves);
  const allProblems = await db.select().from(problems);
  const problemMap = new Map(allProblems.map((p) => [p.id, p]));

  const overdue: unknown[] = [];
  const dueToday: unknown[] = [];
  const upcoming: Record<string, unknown[]> = {};

  for (let i = 1; i <= 30; i++) {
    upcoming[addDays(todayStr, i)] = [];
  }

  for (const solve of allSolves) {
    const p = problemMap.get(solve.problemId);
    if (!p) continue;

    // Get the last review for this problem
    const lastReviewRows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.problemId, solve.problemId))
      .orderBy(desc(reviews.id))
      .limit(1);

    const lastReview = lastReviewRows[0] ?? null;
    const nextDue = lastReview ? lastReview.nextDue : addDays(solve.solvedAt, 1);

    const entry = {
      problem: p,
      nextDue,
      reviewNumber: (lastReview?.reviewNumber ?? 0) + 1,
      lastQuality: lastReview?.quality ?? null,
    };

    if (nextDue < todayStr) overdue.push(entry);
    else if (nextDue === todayStr) dueToday.push(entry);
    else if (upcoming[nextDue] !== undefined) upcoming[nextDue].push(entry);
  }

  return NextResponse.json({ overdue, dueToday, upcoming });
}
