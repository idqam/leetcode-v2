import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patterns } from "@/db/schema";

export async function GET() {
  const result = await db.query.patterns.findMany({
    with: { problemLinks: { with: { problem: true } } },
    orderBy: (p, { asc }) => asc(p.title),
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [created] = await db
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
}
