import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { withUserDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { patternProblems } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { problemIds } = (await req.json()) as { problemIds: string[] };

  return withUserDb(auth.accessToken, async (tx) => {
    for (const problemId of problemIds) {
      // user_id is filled by the column DEFAULT auth.uid().
      await tx
        .insert(patternProblems)
        .values({ patternId: Number(id), problemId })
        .onConflictDoNothing();
    }
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { problemId } = await req.json();

  return withUserDb(auth.accessToken, async (tx) => {
    await tx
      .delete(patternProblems)
      .where(
        and(
          eq(patternProblems.patternId, Number(id)),
          eq(patternProblems.problemId, problemId)
        )
      );
    return NextResponse.json({ ok: true });
  });
}
