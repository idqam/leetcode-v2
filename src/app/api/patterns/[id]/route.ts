import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { patterns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await db.update(patterns).set(body).where(eq(patterns.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(patterns).where(eq(patterns.id, Number(id)));
  return NextResponse.json({ ok: true });
}
