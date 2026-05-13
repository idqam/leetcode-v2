"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "./DifficultyBadge";
import { ReviewModal } from "./ReviewModal";
import { ExternalLink } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { QUALITY_LABELS, type Quality } from "@/lib/algo";

type ReviewStatus = "overdue" | "due-today" | "upcoming" | "not-solved";

interface ReviewHistoryItem {
  id: number;
  reviewNumber: number;
  completedAt: string;
  quality: number;
  timeTaken: number | null;
  intervalDays: number;
  nextDue: string;
  ef: number;
}

interface Problem {
  id: string;
  title: string;
  url?: string | null;
  difficulty: string;
  topics?: string[];
  solution: string;
  explanation: string;
  solved: boolean;
  solvedAt?: string | null;
  nextDue: string | null;
  reviewStatus: ReviewStatus;
  reviewCount: number;
  reviewHistory?: ReviewHistoryItem[];
  patternLinks?: { pattern: { id: number; title: string } }[];
}

interface Props {
  problem: Problem | null;
  open: boolean;
  onClose: () => void;
  onToggleSolve: (id: string, solved: boolean) => void;
  onCompleteReview: (id: string, quality: Quality, timeTaken: number | null) => Promise<void>;
  onUndoReview: (id: string) => void;
  onSave: (id: string, field: "solution" | "explanation", value: string) => void;
}

const STATUS_BADGE: Record<ReviewStatus, string> = {
  overdue:    "bg-[#F5DADA] text-[#B54A4A] dark:bg-[#3D1A1A] dark:text-[#D46A6A]",
  "due-today":"bg-[#FBF0D6] text-[#B8922A] dark:bg-[#3D2E0A] dark:text-[#D4A843]",
  upcoming:   "bg-[#E4E1D9] text-[#6B7F8E] dark:bg-[#243040] dark:text-[#7A90A4]",
  "not-solved":"bg-[#E4E1D9] text-[#6B7F8E] dark:bg-[#243040] dark:text-[#7A90A4]",
};

const QUALITY_COLOURS: Record<number, string> = {
  1: "text-[#B54A4A] dark:text-[#D46A6A]",
  3: "text-[#B8922A] dark:text-[#D4A843]",
  4: "text-[#3D7EAA] dark:text-[#5B9EC9]",
  5: "text-[#4A8C6F] dark:text-[#5FAD8A]",
};

export function ProblemModal({
  problem, open, onClose, onToggleSolve, onCompleteReview, onUndoReview, onSave,
}: Props) {
  const [editingExplanation, setEditingExplanation] = useState(false);
  const [editingExplanationValue, setEditingExplanationValue] = useState("");
  const [editingSolution, setEditingSolution] = useState(false);
  const [editingSolutionValue, setEditingSolutionValue] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  if (!problem) return null;

  const nextReviewNumber = (problem.reviewCount ?? 0) + 1;

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#F7F5F0] dark:bg-[#1A2230] border-[#D4CFC6] dark:border-[#2A3A4A]">
          <DialogHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <DialogTitle className="text-xl text-[#1C2B3A] dark:text-[#E8EDF2]">{problem.title}</DialogTitle>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(problem.topics ?? []).map((t) => (
                <span key={t} className="text-xs bg-[#E4E1D9] dark:bg-[#243040] text-[#6B7F8E] px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
            {problem.url && (
              <a href={problem.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[#3D7EAA] hover:underline mt-1 w-fit">
                Open on LeetCode <ExternalLink size={12} />
              </a>
            )}
          </DialogHeader>

          {/* Solve + Review actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" variant={problem.solved ? "outline" : "default"}
              onClick={() => onToggleSolve(problem.id, problem.solved)}
              className={problem.solved
                ? "border-[#D4CFC6] dark:border-[#2A3A4A] text-[#6B7F8E]"
                : "bg-[#3D7EAA] hover:bg-[#2E6A94] text-white"}>
              {problem.solved ? "Mark Unsolved" : "Mark Solved"}
            </Button>

            {problem.solved && (
              <>
                <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_BADGE[problem.reviewStatus]}`}>
                  {problem.reviewStatus === "not-solved" ? "—"
                    : problem.reviewStatus === "overdue" ? `Overdue (${formatDate(problem.nextDue!)})`
                    : problem.reviewStatus === "due-today" ? "Due Today"
                    : `Next: ${formatDate(problem.nextDue!)}`}
                </span>
                {(problem.reviewStatus === "overdue" || problem.reviewStatus === "due-today") && (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="text-sm px-3 py-1 rounded bg-[#3D7EAA] hover:bg-[#2E6A94] text-white font-medium">
                    Review Now
                  </button>
                )}
                {problem.reviewCount > 0 && (
                  <button onClick={() => onUndoReview(problem.id)}
                    className="text-xs text-[#6B7F8E] hover:text-[#B54A4A] underline">
                    Undo last review
                  </button>
                )}
              </>
            )}
          </div>

          
          {(problem.reviewHistory?.length ?? 0) > 0 && (
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-[#6B7F8E] mb-2">Review History</h3>
              <div className="space-y-1">
                {problem.reviewHistory!.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-xs text-[#6B7F8E] bg-[#EDEAE3] dark:bg-[#243040] px-3 py-1.5 rounded">
                    <span className="font-mono w-4">#{r.reviewNumber}</span>
                    <span>{formatDate(r.completedAt)}</span>
                    <span className={`font-semibold ${QUALITY_COLOURS[r.quality]}`}>
                      {QUALITY_LABELS[r.quality as Quality] ?? r.quality}
                    </span>
                    {r.timeTaken && <span>{r.timeTaken} min</span>}
                    <span className="ml-auto">→ next in {r.intervalDays}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-[#6B7F8E]">Explanation</h3>
              <button className="text-xs text-[#3D7EAA]"
                onClick={() => {
                  if (!editingExplanation) setEditingExplanationValue(problem.explanation);
                  else onSave(problem.id, "explanation", editingExplanationValue);
                  setEditingExplanation(!editingExplanation);
                }}>
                {editingExplanation ? "Save" : "Edit"}
              </button>
            </div>
            {editingExplanation ? (
              <textarea
                className="w-full h-40 text-sm p-2 border border-[#D4CFC6] dark:border-[#2A3A4A] rounded bg-[#EDEAE3] dark:bg-[#243040] font-mono text-[#1C2B3A] dark:text-[#E8EDF2]"
                value={editingExplanationValue}
                onChange={(e) => setEditingExplanationValue(e.target.value)}
              />
            ) : (
              <div className="text-sm whitespace-pre-wrap bg-[#EDEAE3] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2] p-3 rounded min-h-[60px]">
                {problem.explanation || <span className="text-[#6B7F8E] italic">No explanation yet. Click Edit to add one.</span>}
              </div>
            )}
          </div>

          {/* Solution */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-[#6B7F8E]">Solution</h3>
              <button className="text-xs text-[#3D7EAA]"
                onClick={() => {
                  if (!editingSolution) setEditingSolutionValue(problem.solution);
                  else onSave(problem.id, "solution", editingSolutionValue);
                  setEditingSolution(!editingSolution);
                }}>
                {editingSolution ? "Save" : "Edit"}
              </button>
            </div>
            {editingSolution ? (
              <textarea
                className="w-full h-48 text-sm p-2 border border-[#D4CFC6] dark:border-[#2A3A4A] rounded bg-[#EDEAE3] dark:bg-[#243040] font-mono text-[#1C2B3A] dark:text-[#E8EDF2]"
                value={editingSolutionValue}
                onChange={(e) => setEditingSolutionValue(e.target.value)}
              />
            ) : (
              <SyntaxHighlighter language="python" style={oneDark} customStyle={{ borderRadius: 6, fontSize: 13 }}>
                {problem.solution || "# No solution yet. Click Edit to add one."}
              </SyntaxHighlighter>
            )}
          </div>

          {/* Linked Patterns */}
          {(problem.patternLinks?.length ?? 0) > 0 && (
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-[#6B7F8E] mb-1">Patterns</h3>
              <div className="flex flex-wrap gap-2">
                {problem.patternLinks!.map(({ pattern }) => (
                  <span key={pattern.id} className="text-xs bg-[#D6E8F5] dark:bg-[#1E3A52] text-[#3D7EAA] dark:text-[#5B9EC9] px-2 py-1 rounded">
                    {pattern.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReviewModal
        open={reviewModalOpen}
        problemTitle={problem.title}
        reviewNumber={nextReviewNumber}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={async (q, t) => {
          await onCompleteReview(problem.id, q, t);
          setReviewModalOpen(false);
        }}
      />
    </>
  );
}
