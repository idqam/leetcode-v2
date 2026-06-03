import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { withUserDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { problems, reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { today } from "@/lib/types";
import { addDays } from "@/lib/algo";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  return withUserDb(auth.accessToken, async (tx) => {
    const p = await tx.query.problems.findFirst({
      where: eq(problems.id, id),
      with: {
        solves: true,
        patternLinks: { with: { pattern: true } },
      },
    });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const reviewHistory = await tx
      .select()
      .from(reviews)
      .where(eq(reviews.problemId, id))
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
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const allowed = ["solution", "explanation"] as const;
  const update: Partial<Record<(typeof allowed)[number], string>> = {};
  for (const key of allowed) {
    if (key in body) update[key] = String(body[key]);
  }

  return withUserDb(auth.accessToken, async (tx) => {
    await tx.update(problems).set(update).where(eq(problems.id, id));
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  return withUserDb(auth.accessToken, async (tx) => {
    await tx.delete(problems).where(eq(problems.id, id));
    return NextResponse.json({ ok: true });
  });
}
