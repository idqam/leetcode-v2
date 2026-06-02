import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { reviews, problems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { today } from "@/lib/types";
import { computeNextReview, addDays, type Quality } from "@/lib/algo";

export async function POST(req: NextRequest) {
  const { problemId, quality, timeTaken } = await req.json() as {
    problemId: string;
    quality: Quality;
    timeTaken?: number | null;
  };

  const problem = await db.query.problems.findFirst({
    where: eq(problems.id, problemId),
  });
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const prevReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.problemId, problemId))
    .orderBy(desc(reviews.id));

  const lastReview = prevReviews[0] ?? null;
  const reviewNumber = (lastReview?.reviewNumber ?? 0) + 1;
  const prevEF = lastReview?.ef ?? 2.5;
  const prevIntervalDays = lastReview?.intervalDays ?? 0;

  const { nextIntervalDays, newEF } = computeNextReview({
    reviewNumber,
    prevIntervalDays,
    prevEF,
    quality,
    timeTaken: timeTaken ?? null,
    difficulty: problem.difficulty,
  });

  const completedToday = today();
  const nextDue = addDays(completedToday, nextIntervalDays);

  await db.insert(reviews).values({
    problemId,
    reviewNumber,
    completedAt: completedToday,
    quality,
    timeTaken: timeTaken ?? null,
    intervalDays: nextIntervalDays,
    ef: newEF,
    nextDue,
  });

  return NextResponse.json({ ok: true, nextDue, intervalDays: nextIntervalDays });
}

// Undo the most recent review for a problem
export async function DELETE(req: NextRequest) {
  const { problemId } = await req.json();
  const last = await db
    .select()
    .from(reviews)
    .where(eq(reviews.problemId, problemId))
    .orderBy(desc(reviews.id))
    .limit(1);
  if (last[0]) {
    await db.delete(reviews).where(eq(reviews.id, last[0].id));
  }
  return NextResponse.json({ ok: true });
}
