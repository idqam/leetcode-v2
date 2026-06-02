"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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

const TIP = {
  backgroundColor: "#EDEAE3",
  border: "1px solid #D4CFC6",
  borderRadius: "6px",
  fontSize: "12px",
  color: "#1C2B3A",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-[#6B7F8E] text-sm">Loading…</div>
  );

  const listNames = Array.from(new Set(data.listProgress.map((r) => r.list_name)));
  const listStats = listNames.map((name) => {
    const rows = data.listProgress.filter((r) => r.list_name === name);
    return {
      name,
      total: rows.reduce((a, r) => a + r.total, 0),
      solved: rows.reduce((a, r) => a + r.solved, 0),
      easy:   rows.find((r) => r.difficulty === "Easy"),
      medium: rows.find((r) => r.difficulty === "Medium"),
      hard:   rows.find((r) => r.difficulty === "Hard"),
    };
  });

  const diffCumulative = buildCumulative(data.byDifficulty);
  const isEmpty = data.solvesPerWeek.length === 0 && data.byDifficulty.length === 0;

  const last = diffCumulative[diffCumulative.length - 1];
  const totalEasy   = last?.Easy   ?? 0;
  const totalMedium = last?.Medium ?? 0;
  const totalHard   = last?.Hard   ?? 0;
  const totalSolved = totalEasy + totalMedium + totalHard;
  const totalReviews = data.reviewsPerDay.reduce((a, r) => a + r.count, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      {!isEmpty && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Solved" value={totalSolved} />
          <StatCard label="Easy"   value={totalEasy}   accent="#4A8C6F" accentBg="#D4EDE3" />
          <StatCard label="Medium" value={totalMedium} accent="#B8922A" accentBg="#FBF0D6" />
          <StatCard label="Hard"   value={totalHard}   accent="#B54A4A" accentBg="#F5DADA" />
        </div>
      )}

      {isEmpty ? (
        <div className="bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-xl p-12 text-center space-y-2">
          <p className="text-base font-semibold text-[#1C2B3A] dark:text-[#E8EDF2]">No data yet</p>
          <p className="text-sm text-[#6B7F8E]">Solve problems in the Tracker to see your progress here.</p>
        </div>
      ) : (
        <>
          {listStats.length > 0 && (
            <section>
              <SectionLabel text="List Progress" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {listStats.map((ls) => (
                  <div key={ls.name} className="bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-xl p-4 flex flex-col items-center gap-3">
                    <span className="text-xs font-semibold text-[#6B7F8E] uppercase tracking-wide">{ls.name}</span>
                    <CircularProgress solved={ls.solved} total={ls.total} size={80} />
                    <div className="w-full text-xs space-y-1.5">
                      {(["Easy", "Medium", "Hard"] as const).map((d) => {
                        const row = ls[d.toLowerCase() as "easy" | "medium" | "hard"];
                        if (!row) return null;
                        const pct = row.total === 0 ? 0 : Math.round((row.solved / row.total) * 100);
                        return (
                          <div key={d} className="flex items-center gap-2">
                            <span className="text-[#6B7F8E] w-12">{d}</span>
                            <div className="flex-1 bg-[#D4CFC6] dark:bg-[#2A3A4A] rounded-full h-1">
                              <div className="h-1 rounded-full transition-all duration-500" style={{
                                width: `${pct}%`,
                                backgroundColor: d === "Easy" ? "#4A8C6F" : d === "Medium" ? "#B8922A" : "#B54A4A",
                              }} />
                            </div>
                            <span className="text-[#1C2B3A] dark:text-[#E8EDF2] w-12 text-right">{row.solved}/{row.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(data.solvesPerWeek.length > 0 || diffCumulative.length > 0) && (
            <section>
              <SectionLabel text="Solve Trends" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.solvesPerWeek.length > 0 && (
                  <ChartCard title="Solves per Week">
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={data.solvesPerWeek} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6B7F8E" }} tickFormatter={(v) => String(v).slice(5)} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6B7F8E" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TIP} />
                        <Line type="monotone" dataKey="count" stroke="#3D7EAA" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
                {diffCumulative.length > 0 && (
                  <ChartCard title="Cumulative by Difficulty">
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={diffCumulative} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7F8E" }} tickFormatter={(v) => String(v).slice(5)} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6B7F8E" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TIP} />
                        <Line type="monotone" dataKey="Easy"   stroke="#4A8C6F" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="Medium" stroke="#B8922A" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="Hard"   stroke="#B54A4A" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 justify-end">
                      <Dot color="#4A8C6F" label="Easy" />
                      <Dot color="#B8922A" label="Medium" />
                      <Dot color="#B54A4A" label="Hard" />
                    </div>
                  </ChartCard>
                )}
              </div>
            </section>
          )}

          <section>
            <SectionLabel text="Review Activity" />
            <div className="bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-xl p-5">
              <BentoHeatmap reviewsPerDay={data.reviewsPerDay} byDifficulty={data.byDifficulty} />
            </div>
          </section>

          {totalReviews > 0 && (
            <p className="text-center text-xs text-[#6B7F8E]">{totalReviews.toLocaleString()} total reviews logged</p>
          )}
        </>
      )}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7F8E] mb-3">{text}</h2>;
}

function StatCard({ label, value, accent, accentBg }: { label: string; value: number; accent?: string; accentBg?: string }) {
  return (
    <div className="border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-xl p-4" style={{ backgroundColor: accentBg ?? "#EDEAE3" }}>
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: accent ?? "#6B7F8E" }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: accent ?? "#1C2B3A" }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-xl p-4">
      <div className="text-xs font-semibold text-[#6B7F8E] mb-3">{title}</div>
      {children}
    </div>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-[#6B7F8E]">
      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
