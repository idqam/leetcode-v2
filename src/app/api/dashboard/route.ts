import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const solvesPerWeek = await db.execute(sql`
    SELECT date_trunc('week', solved_at::timestamptz)::date AS week,
           count(*)::int AS count
    FROM solves
    GROUP BY 1 ORDER BY 1
  `);

  const byDifficulty = await db.execute(sql`
    SELECT s.solved_at::date AS date, p.difficulty, count(*)::int AS count
    FROM solves s
    JOIN problems p ON p.id = s.problem_id
    GROUP BY 1, 2 ORDER BY 1
  `);

  const reviewsPerDay = await db.execute(sql`
    SELECT completed_at::date AS date, count(*)::int AS count
    FROM reviews
    GROUP BY 1 ORDER BY 1
  `);

  const listProgress = await db.execute(sql`
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
}
