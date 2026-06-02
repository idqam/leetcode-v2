"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CircularProgress } from "@/components/CircularProgress";
import { BentoHeatmap } from "@/components/BentoHeatmap";

interface DashboardData {
  solvesPerWeek: { week: string; count: number }[];
  byDifficulty: { date: string; difficulty: string; count: number }[];
  reviewsPerDay: { date: string; count: number }[];
  listProgress: { list_name: string; difficulty: string; total: number; solved: number }[];
}


function buildCumulative(rows: { date: string; difficulty: string; count: number }[]) {
  const byDate = new Map<string, Record<string, number>>();
  for (const r of rows) {
    if (!byDate.has(r.date)) byDate.set(r.date, {});
    byDate.get(r.date)![r.difficulty] = r.count;
  }
  const dates = Array.from(byDate.keys()).sort();
  let easy = 0, medium = 0, hard = 0;
  return dates.map((date) => {
    const d = byDate.get(date)!;
    easy += d.Easy ?? 0; medium += d.Medium ?? 0; hard += d.Hard ?? 0;
    return { date, Easy: easy, Medium: medium, Hard: hard };
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-[#6B7F8E]">Loading…</div>
  );

  const listNames = Array.from(new Set(data.listProgress.map((r) => r.list_name)));
  const listStats = listNames.map((name) => {
    const rows = data.listProgress.filter((r) => r.list_name === name);
    return {
      name,
      total: rows.reduce((a, r) => a + r.total, 0),
      solved: rows.reduce((a, r) => a + r.solved, 0),
      easy: rows.find((r) => r.difficulty === "Easy"),
      medium: rows.find((r) => r.difficulty === "Medium"),
      hard: rows.find((r) => r.difficulty === "Hard"),
    };
  });

  const diffCumulative = buildCumulative(data.byDifficulty);
  const isEmpty = data.solvesPerWeek.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-2xl font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">Dashboard</h1>

      {isEmpty ? (
        <div className="text-center py-16 text-[#6B7F8E]">
          <p className="text-lg mb-2">No data yet.</p>
          <p className="text-sm">Start solving problems in the Tracker to see your progress here.</p>
        </div>
      ) : (
        <>
          {/* Per-list progress cards */}
          {listStats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listStats.map((ls) => (
                <div key={ls.name} className="border border-[#D4CFC6] dark:border-[#2A3A4A] bg-[#EDEAE3] dark:bg-[#1A2230] rounded-xl p-4 flex flex-col items-center gap-3">
                  <span className="text-sm font-semibold text-[#6B7F8E]">{ls.name}</span>
                  <CircularProgress solved={ls.solved} total={ls.total} size={80} />
                  <div className="w-full text-xs space-y-1">
                    {(["Easy", "Medium", "Hard"] as const).map((d) => {
                      const row = ls[d.toLowerCase() as "easy" | "medium" | "hard"];
                      if (!row) return null;
                      return (
                        <div key={d} className="flex justify-between">
                          <span className="text-[#6B7F8E]">{d}</span>
                          <span className="text-[#1C2B3A] dark:text-[#E8EDF2]">{row.solved}/{row.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Solve velocity */}
          {data.solvesPerWeek.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-[#1C2B3A] dark:text-[#E8EDF2]">Solves per Week</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.solvesPerWeek}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7F8E" }} tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7F8E" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3D7EAA" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cumulative by difficulty */}
          {diffCumulative.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-[#1C2B3A] dark:text-[#E8EDF2]">Cumulative Solves by Difficulty</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={diffCumulative}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7F8E" }} tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7F8E" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Easy" stroke="#4A8C6F" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="Medium" stroke="#B8922A" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="Hard" stroke="#B54A4A" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bento heatmap */}
          <BentoHeatmap reviewsPerDay={data.reviewsPerDay} byDifficulty={data.byDifficulty} />
        </>
      )}
    </div>
  );
}
