import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { withUserDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { problems } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  return withUserDb(auth.accessToken, async (tx) => {
    const rows = await tx
      .selectDistinct({ listName: problems.listName })
      .from(problems)
      .orderBy(sql`list_name asc`);
    return NextResponse.json(rows.map((r) => r.listName));
  });
}
