"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { CircularProgress } from "@/components/CircularProgress";
import { ProblemModal } from "@/components/ProblemModal";
import { ReviewModal } from "@/components/ReviewModal";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useCachedFetch } from "@/lib/useCachedFetch";
import { type Quality } from "@/lib/algo";
import { Plus, X } from "lucide-react";

type ReviewStatus = "overdue" | "due-today" | "upcoming" | "not-solved";
type Difficulty = "Easy" | "Medium" | "Hard";

interface Problem {
  id: string; title: string; url?: string; difficulty: string; topics?: string[];
  section?: string; solution: string; explanation: string;
  solved: boolean; solvedAt?: string | null;
  nextDue: string | null; reviewStatus: ReviewStatus; reviewCount: number;
  lastQuality: number | null; lastEF: number;
  patternLinks?: { pattern: { id: number; title: string } }[];
}

interface NewProblemForm {
  title: string; difficulty: Difficulty; url: string;
  topics: string; section: string; listName: string;
}

const STATUS_BADGE: Record<ReviewStatus, { label: (p: Problem) => string; colour: string }> = {
  overdue:     { label: (p) => `Overdue (${fmtDate(p.nextDue!)})`, colour: "bg-[#F5DADA] text-[#B54A4A] dark:bg-[#3D1A1A] dark:text-[#D46A6A]" },
  "due-today": { label: () => "Due Today",   colour: "bg-[#FBF0D6] text-[#B8922A] dark:bg-[#3D2E0A] dark:text-[#D4A843]" },
  upcoming:    { label: (p) => `Next: ${fmtDate(p.nextDue!)}`, colour: "bg-[#E4E1D9] text-[#6B7F8E] dark:bg-[#243040] dark:text-[#7A90A4]" },
  "not-solved":{ label: () => "—", colour: "" },
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function TrackerPage() {
  const [list, setList] = useLocalStorage<string>("tracker.list", "");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useLocalStorage<string>("tracker.difficulty", "All");
  const [showDueOnly, setShowDueOnly] = useLocalStorage<boolean>("tracker.dueOnly", false);
  const [modalProblem, setModalProblem] = useState<unknown | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string; reviewNumber: number } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProblem, setNewProblem] = useState<NewProblemForm>({
    title: "", difficulty: "Medium", url: "", topics: "", section: "", listName: "",
  });
  const [addingProblem, setAddingProblem] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(0);

  // Fetch lists with caching
  const { data: lists = [], refetch: refetchLists } = useCachedFetch<string[]>(
    `/api/problems/lists?v=${cacheBuster}`
  );

  // Fetch problems for current list with caching
  const { data: problems = [], refetch: refetchProblems } = useCachedFetch<Problem[]>(
    list ? `/api/problems?list=${encodeURIComponent(list)}&v=${cacheBuster}` : "",
    { skip: !list }
  );

  // Initialize list if needed
  useEffect(() => {
    if (lists.length > 0 && (!list || !lists.includes(list))) {
      setList(lists[0]);
    }
  }, [lists, list, setList]);

  // Invalidate cache after mutations
  const invalidateCache = useCallback(() => {
    setCacheBuster((prev) => prev + 1);
  }, []);

  const filtered = useMemo(() => problems.filter((p) => {
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterDifficulty !== "All" && p.difficulty !== filterDifficulty) return false;
    if (showDueOnly) {
      if (!p.solved) return false;
      return p.reviewStatus === "overdue" || p.reviewStatus === "due-today";
    }
    return true;
  }), [problems, filterDifficulty, showDueOnly, searchQuery]);

  const stats = {
    total: problems.length,
    solved: problems.filter((p) => p.solved).length,
    easy: problems.filter((p) => p.difficulty === "Easy" && p.solved).length,
    medium: problems.filter((p) => p.difficulty === "Medium" && p.solved).length,
    hard: problems.filter((p) => p.difficulty === "Hard" && p.solved).length,
  };

  async function toggleSolve(id: string, solved: boolean) {
    if (solved) {
      await fetch("/api/solves", { method: "DELETE", body: JSON.stringify({ problemId: id }), headers: { "Content-Type": "application/json" } });
    } else {
      await fetch("/api/solves", { method: "POST", body: JSON.stringify({ problemId: id }), headers: { "Content-Type": "application/json" } });
    }
    invalidateCache();
  }

  async function completeReview(problemId: string, quality: Quality, timeTaken: number | null) {
    await fetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({ problemId, quality, timeTaken }),
      headers: { "Content-Type": "application/json" },
    });
    invalidateCache();
    if (modalProblem && (modalProblem as { id: string }).id === problemId) {
      const res = await fetch(`/api/problems/${problemId}`);
      setModalProblem(await res.json());
    }
  }

  async function undoReview(problemId: string) {
    await fetch("/api/reviews", {
      method: "DELETE",
      body: JSON.stringify({ problemId }),
      headers: { "Content-Type": "application/json" },
    });
    invalidateCache();
    if (modalProblem && (modalProblem as { id: string }).id === problemId) {
      const res = await fetch(`/api/problems/${problemId}`);
      setModalProblem(await res.json());
    }
  }

  async function saveProblemField(id: string, field: "solution" | "explanation", value: string) {
    await fetch(`/api/problems/${id}`, { method: "PATCH", body: JSON.stringify({ [field]: value }), headers: { "Content-Type": "application/json" } });
  }

  async function openModal(p: Problem) {
    const res = await fetch(`/api/problems/${p.id}`);
    setModalProblem(await res.json());
  }

  async function addProblem() {
    if (!newProblem.title.trim()) return;
    setAddingProblem(true);
    const listName = newProblem.listName.trim() || list || "My Problems";
    await fetch("/api/problems", {
      method: "POST",
      body: JSON.stringify({
        title: newProblem.title.trim(),
        difficulty: newProblem.difficulty,
        url: newProblem.url.trim() || null,
        topics: newProblem.topics.split(",").map((t) => t.trim()).filter(Boolean),
        section: newProblem.section.trim() || null,
        listName,
      }),
      headers: { "Content-Type": "application/json" },
    });
    setNewProblem({ title: "", difficulty: "Medium", url: "", topics: "", section: "", listName: "" });
    setShowAddForm(false);
    setAddingProblem(false);
    invalidateCache();
    setList(listName);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* List selector + Add button */}
      <div className="flex items-center gap-2 flex-wrap">
        {lists.map((l) => (
          <button key={l} onClick={() => setList(l)}
            className={`px-4 py-1.5 rounded text-sm font-medium border transition-colors ${
              list === l
                ? "bg-[#3D7EAA] text-white border-[#3D7EAA]"
                : "border-[#D4CFC6] dark:border-[#2A3A4A] text-[#6B7F8E] hover:border-[#3D7EAA] hover:text-[#3D7EAA]"
            }`}>
            {l}
          </button>
        ))}
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium border border-dashed border-[#D4CFC6] dark:border-[#2A3A4A] text-[#6B7F8E] hover:border-[#3D7EAA] hover:text-[#3D7EAA] transition-colors">
          <Plus size={14} /> Add Problem
        </button>
      </div>

      {/* Add problem form */}
      {showAddForm && (
        <div className="bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1C2B3A] dark:text-[#E8EDF2]">Add Problem</h3>
            <button onClick={() => setShowAddForm(false)} className="text-[#6B7F8E] hover:text-[#B54A4A]"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <label className="block text-xs text-[#6B7F8E] mb-1">Title *</label>
              <input placeholder="e.g. Two Sum" value={newProblem.title}
                onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]" />
            </div>
            <div>
              <label className="block text-xs text-[#6B7F8E] mb-1">Difficulty</label>
              <select value={newProblem.difficulty}
                onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value as Difficulty })}
                className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6B7F8E] mb-1">List / Group</label>
              <input placeholder={list || "My Problems"} value={newProblem.listName}
                onChange={(e) => setNewProblem({ ...newProblem, listName: e.target.value })}
                className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]" />
            </div>
            <div>
              <label className="block text-xs text-[#6B7F8E] mb-1">LeetCode URL</label>
              <input placeholder="https://leetcode.com/problems/..." value={newProblem.url}
                onChange={(e) => setNewProblem({ ...newProblem, url: e.target.value })}
                className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]" />
            </div>
            <div>
              <label className="block text-xs text-[#6B7F8E] mb-1">Topics (comma-separated)</label>
              <input placeholder="Array, Hash Table" value={newProblem.topics}
                onChange={(e) => setNewProblem({ ...newProblem, topics: e.target.value })}
                className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]" />
            </div>
          </div>
          <button onClick={addProblem} disabled={addingProblem || !newProblem.title.trim()}
            className="px-4 py-1.5 text-sm font-medium bg-[#3D7EAA] hover:bg-[#2E6A94] text-white rounded disabled:opacity-50">
            {addingProblem ? "Adding…" : "Add Problem"}
          </button>
        </div>
      )}

      {/* Stats */}
      {problems.length > 0 && (
        <div className="flex items-center gap-6">
          <CircularProgress solved={stats.solved} total={stats.total} />
          <div className="grid grid-cols-3 gap-6 text-sm">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <div key={d}>
                <span className="capitalize text-[#6B7F8E]">{d}</span>
                <p className="font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">{stats[d]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {problems.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search problems…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[180px] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-1.5 text-sm bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2] placeholder-[#6B7F8E]"
          />
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
            className="border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-2 py-1.5 text-sm bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]">
            {["All", "Easy", "Medium", "Hard"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[#6B7F8E]">
            <input type="checkbox" checked={showDueOnly} onChange={(e) => setShowDueOnly(e.target.checked)} className="accent-[#3D7EAA]" />
            Due today / overdue only
          </label>
        </div>
      )}

      {/* Table */}
      {list && problems.length === 0 ? (
        <div className="text-center py-16 text-[#6B7F8E]">
          <p className="text-lg mb-2">No problems yet.</p>
          <p className="text-sm">Click <strong>Add Problem</strong> above to get started.</p>
        </div>
      ) : !list ? (
        <div className="text-center py-16 text-[#6B7F8E]">
          <p className="text-lg mb-2">No lists yet.</p>
          <p className="text-sm">Click <strong>Add Problem</strong> to create your first list.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#6B7F8E] border-b border-[#D4CFC6] dark:border-[#2A3A4A]">
                <th className="pb-2 w-8"></th>
                <th className="pb-2">Problem</th>
                <th className="pb-2">Difficulty</th>
                <th className="pb-2">Topics</th>
                <th className="pb-2">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const statusInfo = STATUS_BADGE[p.reviewStatus];
                const isDue = p.reviewStatus === "overdue" || p.reviewStatus === "due-today";
                return (
                  <tr key={p.id} className="border-b border-[#D4CFC6] dark:border-[#2A3A4A] hover:bg-[#EDEAE3] dark:hover:bg-[#1A2230]">
                    <td className="py-2">
                      <input type="checkbox" checked={p.solved} onChange={() => toggleSolve(p.id, p.solved)} className="accent-[#3D7EAA]" />
                    </td>
                    <td className="py-2">
                      <button className="hover:underline text-left font-medium text-[#1C2B3A] dark:text-[#E8EDF2]" onClick={() => openModal(p)}>
                        {p.title}
                      </button>
                    </td>
                    <td className="py-2"><DifficultyBadge difficulty={p.difficulty} /></td>
                    <td className="py-2 text-[#6B7F8E]">{(p.topics ?? []).slice(0, 2).join(", ")}</td>
                    <td className="py-2">
                      {p.reviewStatus === "not-solved" ? (
                        <span className="text-[#6B7F8E]">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusInfo.colour}`}>
                            {statusInfo.label(p)}
                          </span>
                          {isDue && (
                            <button
                              onClick={() => setReviewTarget({ id: p.id, title: p.title, reviewNumber: p.reviewCount + 1 })}
                              className="text-xs px-2 py-0.5 rounded bg-[#3D7EAA] hover:bg-[#2E6A94] text-white font-medium">
                              Review
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProblemModal
        problem={modalProblem as never}
        open={!!modalProblem}
        onClose={() => setModalProblem(null)}
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
