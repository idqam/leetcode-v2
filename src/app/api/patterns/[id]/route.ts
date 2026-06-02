import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { patterns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  await db.update(patterns).set(body).where(eq(patterns.id, Number(params.id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(patterns).where(eq(patterns.id, Number(params.id)));
  return NextResponse.json({ ok: true });
}
