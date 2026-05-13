import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patternProblems } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { problemIds } = (await req.json()) as { problemIds: string[] };
  for (const problemId of problemIds) {
    await db
      .insert(patternProblems)
      .values({ patternId: Number(params.id), problemId })
      .onConflictDoNothing();
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { problemId } = await req.json();
  await db
    .delete(patternProblems)
    .where(
      and(
        eq(patternProblems.patternId, Number(params.id)),
        eq(patternProblems.problemId, problemId)
      )
    );
  return NextResponse.json({ ok: true });
}
