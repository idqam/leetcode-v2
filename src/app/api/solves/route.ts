import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { withUserDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { solves, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { today } from "@/lib/types";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { problemId, solvedAt } = await req.json();

  return withUserDb(auth.accessToken, async (tx) => {
    // user_id is filled by the column DEFAULT auth.uid().
    await tx
      .insert(solves)
      .values({ problemId, solvedAt: solvedAt ?? today() })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { problemId } = await req.json();

  return withUserDb(auth.accessToken, async (tx) => {
    await tx.delete(reviews).where(eq(reviews.problemId, problemId));
    await tx.delete(solves).where(eq(solves.problemId, problemId));
    return NextResponse.json({ ok: true });
  });
}
