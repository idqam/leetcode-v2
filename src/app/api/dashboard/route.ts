import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { withUserDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  return withUserDb(auth.accessToken, async (tx) => {
    const solvesPerWeek = await tx.execute(sql`
      SELECT date_trunc('week', solved_at::timestamptz)::date AS week,
             count(*)::int AS count
      FROM solves
      GROUP BY 1 ORDER BY 1
    `);

    const byDifficulty = await tx.execute(sql`
      SELECT s.solved_at::date AS date, p.difficulty, count(*)::int AS count
      FROM solves s
      JOIN problems p ON p.id = s.problem_id
      GROUP BY 1, 2 ORDER BY 1
    `);

    const reviewsPerDay = await tx.execute(sql`
      SELECT completed_at::date AS date, count(*)::int AS count
      FROM reviews
      GROUP BY 1 ORDER BY 1
    `);

    const listProgress = await tx.execute(sql`
      SELECT p.list_name,
             p.difficulty,
             count(p.id)::int AS total,
             count(s.id)::int AS solved
      FROM problems p
      LEFT JOIN solves s ON s.problem_id = p.id
      GROUP BY 1, 2
      ORDER BY 1, 2
    `);

    return NextResponse.json({ solvesPerWeek, byDifficulty, reviewsPerDay, listProgress });
  });
}
