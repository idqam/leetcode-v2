"use client";

import { useEffect, useState } from "react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ProblemModal } from "@/components/ProblemModal";
import { ReviewModal } from "@/components/ReviewModal";
import { type Quality } from "@/lib/algo";

interface BankEntry {
  problem: {
    id: string; title: string; difficulty: string;
    url?: string | null; topics?: string[];
  };
  nextDue: string;
  reviewNumber: number;
  lastQuality: number | null;
}
interface BankData {
  overdue: BankEntry[];
  dueToday: BankEntry[];
  upcoming: Record<string, BankEntry[]>;
}

function sliceUpcoming(upcoming: Record<string, BankEntry[]>, fromDay: number, toDay: number) {
  return Object.entries(upcoming)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(fromDay - 1, toDay);
}

export default function BankPage() {
  const [bank, setBank] = useState<BankData | null>(null);
  const [fullProblem, setFullProblem] = useState<null | unknown>(null);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string; reviewNumber: number } | null>(null);
  const [completedToday, setCompletedToday] = useState(0);

  async function load() {
    const res = await fetch("/api/bank");
    setBank(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function openModal(id: string) {
    const res = await fetch(`/api/problems/${id}`);
    setFullProblem(await res.json());
  }

  async function completeReview(problemId: string, quality: Quality, timeTaken: number | null) {
    await fetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({ problemId, quality, timeTaken }),
      headers: { "Content-Type": "application/json" },
    });
    setCompletedToday((n) => n + 1);
    await load();
    if (fullProblem && (fullProblem as { id: string }).id === problemId) {
      await openModal(problemId);
    }
  }

  async function undoReview(problemId: string) {
    await fetch("/api/reviews", {
      method: "DELETE",
      body: JSON.stringify({ problemId }),
      headers: { "Content-Type": "application/json" },
    });
    await load();
    if (fullProblem && (fullProblem as { id: string }).id === problemId) {
      await openModal(problemId);
    }
  }

  async function toggleSolve(id: string, solved: boolean) {
    if (solved) {
      await fetch("/api/solves", { method: "DELETE", body: JSON.stringify({ problemId: id }), headers: { "Content-Type": "application/json" } });
    } else {
      await fetch("/api/solves", { method: "POST", body: JSON.stringify({ problemId: id }), headers: { "Content-Type": "application/json" } });
    }
    await load();
  }

  async function saveProblemField(id: string, field: "solution" | "explanation", value: string) {
    await fetch(`/api/problems/${id}`, { method: "PATCH", body: JSON.stringify({ [field]: value }), headers: { "Content-Type": "application/json" } });
  }

  if (!bank) return (
    <div className="flex items-center justify-center h-64 text-[#6B7F8E] text-sm">Loading…</div>
  );

  const allClear = bank.overdue.length === 0 && bank.dueToday.length === 0;

  const next7  = sliceUpcoming(bank.upcoming, 1, 7);
  const next15 = sliceUpcoming(bank.upcoming, 8, 15);
  const next30 = sliceUpcoming(bank.upcoming, 16, 30);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

      {/* Centered header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">Review Queue</h1>
        {completedToday > 0 && (
          <p className="text-xs text-[#6B7F8E] mt-1">{completedToday} done this session</p>
        )}
        {!allClear && (
          <div className="flex justify-center gap-3 mt-3">
            {bank.overdue.length > 0 && (
              <StatPill label="Overdue" count={bank.overdue.length} variant="red" />
            )}
            {bank.dueToday.length > 0 && (
              <StatPill label="Due Today" count={bank.dueToday.length} variant="amber" />
            )}
          </div>
        )}
      </div>

      {/* All clear */}
      {allClear && (
        <div className="bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-xl p-8 text-center space-y-2">
          <div className="text-3xl mb-3">✓</div>
          <p className="text-base font-semibold text-[#1C2B3A] dark:text-[#E8EDF2]">All caught up</p>
          <p className="text-sm text-[#6B7F8E]">No reviews due today. Check back tomorrow.</p>
        </div>
      )}

      {/* Overdue */}
      {bank.overdue.length > 0 && (
        <section>
          <SectionLabel text="Overdue" />
          <div className="space-y-2">
            {bank.overdue.map((entry) => (
              <BankCard key={entry.problem.id} entry={entry} variant="overdue"
                onOpen={() => openModal(entry.problem.id)}
                onReview={() => setReviewTarget({ id: entry.problem.id, title: entry.problem.title, reviewNumber: entry.reviewNumber })} />
            ))}
          </div>
        </section>
      )}

      {/* Due today */}
      {bank.dueToday.length > 0 && (
        <section>
          <SectionLabel text="Due Today" />
          <div className="space-y-2">
            {bank.dueToday.map((entry) => (
              <BankCard key={entry.problem.id} entry={entry} variant="due-today"
                onOpen={() => openModal(entry.problem.id)}
                onReview={() => setReviewTarget({ id: entry.problem.id, title: entry.problem.title, reviewNumber: entry.reviewNumber })} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming windows */}
      <UpcomingSection label="Next 7 Days"  days={next7} />
      <UpcomingSection label="Next 15 Days" days={next15} />
      <UpcomingSection label="Next 30 Days" days={next30} />

      <ProblemModal
        problem={fullProblem as never}
        open={!!fullProblem}
        onClose={() => setFullProblem(null)}
        onToggleSolve={toggleSolve}
        onCompleteReview={completeReview}
        onUndoReview={undoReview}
        onSave={saveProblemField}
      />

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          problemTitle={reviewTarget.title}
          reviewNumber={reviewTarget.reviewNumber}
          onClose={() => setReviewTarget(null)}
          onSubmit={async (quality, timeTaken) => {
            await completeReview(reviewTarget.id, quality, timeTaken);
            setReviewTarget(null);
          }}
        />
      )}
    </div>
  );
}

function UpcomingSection({ label, days }: { label: string; days: [string, BankEntry[]][] }) {
  if (days.length === 0) return null;
  return (
    <section>
      <SectionLabel text={label} />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map(([date, entries]) => {
          const d = new Date(date + "T00:00:00");
          const hasItems = entries.length > 0;
          return (
            <div
              key={date}
              className={`flex flex-col items-center justify-center rounded-xl border py-4 gap-1 ${
                hasItems
                  ? "bg-[#D6E8F5] dark:bg-[#1E3A52] border-[#3D7EAA]/30 dark:border-[#3D7EAA]/40"
                  : "bg-[#EDEAE3] dark:bg-[#1A2230] border-[#D4CFC6] dark:border-[#2A3A4A]"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7F8E]">
                {d.toLocaleDateString("en", { weekday: "short" })}
              </span>
              <span className={`text-2xl font-bold leading-none ${hasItems ? "text-[#3D7EAA] dark:text-[#5B9EC9]" : "text-[#1C2B3A] dark:text-[#E8EDF2]"}`}>
                {entries.length}
              </span>
              <span className="text-[10px] text-[#6B7F8E]">
                {d.toLocaleDateString("en", { month: "short", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatPill({ label, count, variant }: { label: string; count: number; variant: "red" | "amber" | "blue" }) {
  const styles = {
    red:   "bg-[#F5DADA] text-[#B54A4A] dark:bg-[#3D1A1A] dark:text-[#D46A6A]",
    amber: "bg-[#FBF0D6] text-[#B8922A] dark:bg-[#3D2E0A] dark:text-[#D4A843]",
    blue:  "bg-[#D6E8F5] text-[#3D7EAA] dark:bg-[#1E3A52] dark:text-[#5B9EC9]",
  };
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${styles[variant]}`}>
      <span className="font-bold text-base leading-none">{count}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7F8E] mb-2.5 text-center">{text}</h2>
  );
}

function BankCard({ entry, variant, onOpen, onReview }: {
  entry: BankEntry;
  variant: "overdue" | "due-today";
  onOpen: () => void;
  onReview: () => void;
}) {
  const accentColor = variant === "overdue" ? "#B54A4A" : "#B8922A";
  const topics = entry.problem.topics ?? [];

  return (
    <div
      className="flex items-center gap-3 bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-lg overflow-hidden"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex-1 min-w-0 py-3 pl-3">
        <button
          className="text-sm font-medium text-[#1C2B3A] dark:text-[#E8EDF2] hover:text-[#3D7EAA] dark:hover:text-[#5B9EC9] text-left transition-colors truncate block max-w-full"
          onClick={onOpen}
        >
          {entry.problem.title}
        </button>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <DifficultyBadge difficulty={entry.problem.difficulty} />
          <span className="text-[10px] text-[#6B7F8E] font-medium">#{entry.reviewNumber} review</span>
          {topics.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#E4E1D9] dark:bg-[#243040] text-[#6B7F8E] font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="pr-3 shrink-0">
        <button
          onClick={onReview}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#3D7EAA] hover:bg-[#2E6A94] text-white font-medium transition-colors"
        >
          Review
        </button>
      </div>
    </div>
  );
}
