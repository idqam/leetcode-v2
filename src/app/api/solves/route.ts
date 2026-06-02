import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { solves, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { today } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { problemId, solvedAt } = await req.json();
  await db
    .insert(solves)
    .values({ problemId, solvedAt: solvedAt ?? today() })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { problemId } = await req.json();
  await db.delete(reviews).where(eq(reviews.problemId, problemId));
  await db.delete(solves).where(eq(solves.problemId, problemId));
  return NextResponse.json({ ok: true });
}
