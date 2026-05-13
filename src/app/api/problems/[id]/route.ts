import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems, reviews, solves } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { today } from "@/lib/types";
import { addDays } from "@/lib/algo";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const p = await db.query.problems.findFirst({
    where: eq(problems.id, params.id),
    with: {
      solves: true,
      patternLinks: { with: { pattern: true } },
    },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reviewHistory = await db
    .select()
    .from(reviews)
    .where(eq(reviews.problemId, params.id))
    .orderBy(desc(reviews.id));

  const solve = p.solves[0] ?? null;
  const lastReview = reviewHistory[0] ?? null;
  const todayStr = today();

  let nextDue: string | null = null;
  let reviewStatus: "overdue" | "due-today" | "upcoming" | "not-solved" = "not-solved";
  if (solve) {
    nextDue = lastReview ? lastReview.nextDue : addDays(solve.solvedAt, 1);
    if (nextDue < todayStr) reviewStatus = "overdue";
    else if (nextDue === todayStr) reviewStatus = "due-today";
    else reviewStatus = "upcoming";
  }

  return NextResponse.json({
    ...p,
    solved: !!solve,
    solvedAt: solve?.solvedAt ?? null,
    reviewHistory,
    reviewCount: reviewHistory.length,
    nextDue,
    reviewStatus,
    lastEF: lastReview?.ef ?? 2.5,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const allowed = ["solution", "explanation"] as const;
  const update: Partial<Record<(typeof allowed)[number], string>> = {};
  for (const key of allowed) {
    if (key in body) update[key] = String(body[key]);
  }
  await db.update(problems).set(update).where(eq(problems.id, params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(problems).where(eq(problems.id, params.id));
  return NextResponse.json({ ok: true });
}
