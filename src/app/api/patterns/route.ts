import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { withUserDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { patterns } from "@/db/schema";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  return withUserDb(auth.accessToken, async (tx) => {
    const result = await tx.query.patterns.findMany({
      with: { problemLinks: { with: { problem: true } } },
      orderBy: (p, { asc }) => asc(p.title),
    });
    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();

  return withUserDb(auth.accessToken, async (tx) => {
    // user_id is filled by the column DEFAULT auth.uid().
    const [created] = await tx
      .insert(patterns)
      .values({
        title: body.title,
        description: body.description ?? "",
        templatePy: body.templatePy ?? "",
        templateJs: body.templateJs ?? "",
        templateJava: body.templateJava ?? "",
        templateGo: body.templateGo ?? "",
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  });
}
