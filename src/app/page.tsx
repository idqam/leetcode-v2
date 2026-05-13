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

export default function BankPage() {
  const [bank, setBank] = useState<BankData | null>(null);
  const [fullProblem, setFullProblem] = useState<null | unknown>(null);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string; reviewNumber: number } | null>(null);

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

  if (!bank) return <div className="flex items-center justify-center h-64 text-[#6B7F8E]">Loading…</div>;

  const upcomingDays = Object.entries(bank.upcoming).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex gap-4">
        <Chip label="Overdue" count={bank.overdue.length} colour="red" />
        <Chip label="Due Today" count={bank.dueToday.length} colour="yellow" />
        <Chip label="Next 7 Days" count={upcomingDays.reduce((a, [, v]) => a + v.length, 0)} colour="blue" />
      </div>

      {bank.overdue.length > 0 && (
        <Section title="Overdue">
          {bank.overdue.map((entry) => (
            <BankCard key={entry.problem.id} entry={entry} status="overdue"
              onOpen={() => openModal(entry.problem.id)}
              onReview={() => setReviewTarget({ id: entry.problem.id, title: entry.problem.title, reviewNumber: entry.reviewNumber })} />
          ))}
        </Section>
      )}

      {bank.dueToday.length > 0 && (
        <Section title="Due Today">
          {bank.dueToday.map((entry) => (
            <BankCard key={entry.problem.id} entry={entry} status="due-today"
              onOpen={() => openModal(entry.problem.id)}
              onReview={() => setReviewTarget({ id: entry.problem.id, title: entry.problem.title, reviewNumber: entry.reviewNumber })} />
          ))}
        </Section>
      )}

      {upcomingDays.some(([, v]) => v.length > 0) && (
        <Section title="Upcoming (7 days)">
          <div className="flex gap-2 flex-wrap">
            {upcomingDays.map(([date, entries]) => (
              <div key={date} className="flex flex-col items-center bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-2 min-w-[60px]">
                <span className="text-xs text-[#6B7F8E]">{new Date(date + "T00:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="text-lg font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">{entries.length}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {bank.overdue.length === 0 && bank.dueToday.length === 0 && (
        <div className="text-center py-16 text-[#6B7F8E]">
          <p className="text-2xl mb-2">All caught up!</p>
          <p className="text-sm">No reviews due today.</p>
        </div>
      )}

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

function Chip({ label, count, colour }: { label: string; count: number; colour: string }) {
  const colours: Record<string, string> = {
    red:    "bg-[#F5DADA] text-[#B54A4A] dark:bg-[#3D1A1A] dark:text-[#D46A6A]",
    yellow: "bg-[#FBF0D6] text-[#B8922A] dark:bg-[#3D2E0A] dark:text-[#D4A843]",
    blue:   "bg-[#D6E8F5] text-[#3D7EAA] dark:bg-[#1E3A52] dark:text-[#5B9EC9]",
  };
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colours[colour]}`}>
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7F8E] mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BankCard({ entry, status, onOpen, onReview }: {
  entry: BankEntry;
  status: "overdue" | "due-today";
  onOpen: () => void;
  onReview: () => void;
}) {
  const badgeColour = status === "overdue"
    ? "bg-[#F5DADA] text-[#B54A4A] dark:bg-[#3D1A1A] dark:text-[#D46A6A]"
    : "bg-[#FBF0D6] text-[#B8922A] dark:bg-[#3D2E0A] dark:text-[#D4A843]";

  return (
    <div className="flex items-center justify-between p-3 bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-lg">
      <button className="text-sm font-medium hover:underline text-left text-[#1C2B3A] dark:text-[#E8EDF2] flex-1 min-w-0 pr-3" onClick={onOpen}>
        {entry.problem.title}
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <DifficultyBadge difficulty={entry.problem.difficulty} />
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${badgeColour}`}>
          {status === "overdue" ? `Overdue` : "Due Today"}
        </span>
        <button
          onClick={onReview}
          className="text-xs px-2 py-1 rounded bg-[#3D7EAA] hover:bg-[#2E6A94] text-white font-medium">
          Review
        </button>
      </div>
    </div>
  );
}
