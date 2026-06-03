import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { withUserDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { patterns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();

  return withUserDb(auth.accessToken, async (tx) => {
    await tx.update(patterns).set(body).where(eq(patterns.id, Number(id)));
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  return withUserDb(auth.accessToken, async (tx) => {
    await tx.delete(patterns).where(eq(patterns.id, Number(id)));
    return NextResponse.json({ ok: true });
  });
}
