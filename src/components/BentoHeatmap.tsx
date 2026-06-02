"use client";

import { useState, useMemo } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";

interface ReviewDay { date: string; count: number }
interface DifficultyDay { date: string; difficulty: string; count: number }

interface Props {
  reviewsPerDay: ReviewDay[];
  byDifficulty: DifficultyDay[];
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function dotColor(count: number | null): string {
  if (count === null) return "transparent";
  if (count === 0) return "#D4CFC6";
  if (count === 1) return "#9FCFB8";
  if (count <= 3) return "#5FAD8A";
  if (count <= 5) return "#4A8C6F";
  return "#2E6B52";
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Returns Mon=0 … Sun=6 offset for the 1st of the month
function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface MonthCardProps {
  year: number;
  month: number;
  reviewsPerDay: ReviewDay[];
  byDifficulty: DifficultyDay[];
}

function MonthCard({ year, month, reviewsPerDay, byDifficulty }: MonthCardProps) {
  const [locked, setLocked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showBack = locked || hovered;

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const numDays = getDaysInMonth(year, month);
  const offset = getFirstDayOffset(year, month);

  const reviewMap = new Map<string, number>();
  reviewsPerDay
    .filter((r) => r.date.startsWith(monthStr))
    .forEach((r) => reviewMap.set(r.date, r.count));

  const dots: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: numDays }, (_, d) => {
      const date = `${monthStr}-${String(d + 1).padStart(2, "0")}`;
      return reviewMap.get(date) ?? 0;
    }),
  ];
  while (dots.length % 7 !== 0) dots.push(null);

  const monthSolves = byDifficulty.filter((r) => r.date.startsWith(monthStr));
  const totalProblems = monthSolves.reduce((a, r) => a + r.count, 0);
  const easy = monthSolves.filter((r) => r.difficulty === "Easy").reduce((a, r) => a + r.count, 0);
  const medium = monthSolves.filter((r) => r.difficulty === "Medium").reduce((a, r) => a + r.count, 0);
  const hard = monthSolves.filter((r) => r.difficulty === "Hard").reduce((a, r) => a + r.count, 0);
  const totalReviews = reviewsPerDay
    .filter((r) => r.date.startsWith(monthStr))
    .reduce((a, r) => a + r.count, 0);
  const dailyAvg = (totalReviews / numDays).toFixed(1);

  const lockedBorder: React.CSSProperties = locked
    ? { borderColor: "#D46A6A", boxShadow: "0 0 0 2px rgba(212,106,106,0.25)" }
    : { borderColor: "#D4CFC6" };

  const sharedFace: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden" as never,
    borderRadius: "10px",
    border: "1px solid",
    transition: "border-color 0.2s, box-shadow 0.2s",
    ...lockedBorder,
  };

  return (
    <div
      style={{ perspective: "800px", height: "144px", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocked((l) => !l)}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transition: "transform 0.45s ease",
          transformStyle: "preserve-3d",
          transform: showBack ? "rotateY(180deg)" : "none",
        }}
      >
        {/* Front */}
        <div style={{ ...sharedFace, background: "#EDEAE3", padding: "8px" }}>
          <div style={{
            fontSize: "10px", fontWeight: 600, color: "#6B7F8E",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px",
          }}>
            {MONTH_NAMES[month]}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {dots.map((count, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: "2px", background: dotColor(count) }} />
            ))}
          </div>
        </div>

        {/* Back */}
        <div style={{
          ...sharedFace,
          transform: "rotateY(180deg)",
          background: "#1C2B3A",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "4px",
        }}>
          <div style={{ fontSize: "9px", color: "#7A90A4", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Total problems
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#E8EDF2", lineHeight: 1 }}>
            {totalProblems}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 5px", borderRadius: "4px", background: "#1A3D2E", color: "#5FAD8A" }}>E {easy}</span>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 5px", borderRadius: "4px", background: "#3D2E0A", color: "#D4A843" }}>M {medium}</span>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 5px", borderRadius: "4px", background: "#3D1A1A", color: "#D46A6A" }}>H {hard}</span>
          </div>
          <div style={{ fontSize: "10px", color: "#7A90A4" }}>
            Daily avg <span style={{ color: "#9FCFB8", fontWeight: 600 }}>{dailyAvg}</span>/day
          </div>
        </div>
      </div>
    </div>
  );
}

export function BentoHeatmap({ reviewsPerDay, byDifficulty }: Props) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    reviewsPerDay.forEach((r) => years.add(parseInt(r.date.slice(0, 4))));
    byDifficulty.forEach((r) => years.add(parseInt(r.date.slice(0, 4))));
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [reviewsPerDay, byDifficulty, currentYear]);

  const [selectedYear, setSelectedYear] = useLocalStorage<number>(
    "dashboard.year",
    availableYears.includes(currentYear) ? currentYear : availableYears[0] ?? currentYear
  );

  return (
    <div>
      {availableYears.length > 1 && (
        <div className="flex justify-end mb-3">
          <div className="inline-flex gap-1 bg-[#E4E1D9] dark:bg-[#243040] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-lg p-0.5">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                  selectedYear === year
                    ? "bg-[#3D7EAA] text-white"
                    : "text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2]"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: 12 }, (_, month) => (
          <MonthCard
            key={`${selectedYear}-${month}`}
            year={selectedYear}
            month={month}
            reviewsPerDay={reviewsPerDay}
            byDifficulty={byDifficulty}
          />
        ))}
      </div>

      <p className="text-center mt-3 text-xs text-[#6B7F8E]">
        Hover to see month stats · Click to lock
      </p>
    </div>
  );
}
