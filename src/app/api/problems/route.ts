import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { today } from "@/lib/types";
import { addDays } from "@/lib/algo";

export async function GET(req: NextRequest) {
  const listName = req.nextUrl.searchParams.get("list") ?? "My Problems";
  const todayStr = today();

  const allProblems = await db.query.problems.findMany({
    where: eq(problems.listName, listName),
    with: { solves: true, reviews: { orderBy: (r, { desc }) => desc(r.id) } },
  });

  const result = allProblems.map((p) => {
    const solve = p.solves[0] ?? null;
    const lastReview = p.reviews[0] ?? null;

    let nextDue: string | null = null;
    let reviewStatus: "overdue" | "due-today" | "upcoming" | "not-solved" = "not-solved";

    if (solve) {
      nextDue = lastReview ? lastReview.nextDue : addDays(solve.solvedAt, 1);
      if (nextDue < todayStr) reviewStatus = "overdue";
      else if (nextDue === todayStr) reviewStatus = "due-today";
      else reviewStatus = "upcoming";
    }

    return {
      ...p,
      reviews: undefined, // omit the full reviews array
      solved: !!solve,
      solvedAt: solve?.solvedAt ?? null,
      reviewCount: p.reviews.length,
      nextDue,
      reviewStatus,
      lastQuality: lastReview?.quality ?? null,
      lastEF: lastReview?.ef ?? 2.5,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = body.id ?? `problem-${Date.now()}`;
  const slug = body.slug ?? body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  await db.insert(problems).values({
    id,
    title: body.title,
    slug,
    url: body.url ?? null,
    difficulty: body.difficulty,
    topics: body.topics ?? [],
    companies: [],
    listName: body.listName ?? "My Problems",
    section: body.section ?? null,
    solution: "",
    explanation: "",
  });

  return NextResponse.json({ id }, { status: 201 });
}
