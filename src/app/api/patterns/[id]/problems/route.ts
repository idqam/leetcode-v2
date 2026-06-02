import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { patternProblems } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { problemIds } = (await req.json()) as { problemIds: string[] };
  for (const problemId of problemIds) {
    await db
      .insert(patternProblems)
      .values({ patternId: Number(id), problemId })
      .onConflictDoNothing();
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { problemId } = await req.json();
  await db
    .delete(patternProblems)
    .where(
      and(
        eq(patternProblems.patternId, Number(id)),
        eq(patternProblems.problemId, problemId)
      )
    );
  return NextResponse.json({ ok: true });
}
