import { NextResponse } from "next/server";
import { db } from "@/db";
import { problems } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .selectDistinct({ listName: problems.listName })
    .from(problems)
    .orderBy(sql`list_name asc`);
  return NextResponse.json(rows.map((r) => r.listName));
}
