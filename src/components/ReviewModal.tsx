"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Quality } from "@/lib/algo";

interface Props {
  open: boolean;
  problemTitle: string;
  reviewNumber: number;
  onClose: () => void;
  onSubmit: (quality: Quality, timeTaken: number | null) => Promise<void>;
}

const QUALITY_OPTIONS: { value: Quality; label: string; description: string; colour: string }[] = [
  { value: 1, label: "Again", description: "Completely forgot", colour: "border-[#B54A4A] bg-[#F5DADA] text-[#B54A4A] dark:border-[#D46A6A] dark:bg-[#3D1A1A] dark:text-[#D46A6A]" },
  { value: 3, label: "Hard",  description: "Got it, but struggled", colour: "border-[#B8922A] bg-[#FBF0D6] text-[#B8922A] dark:border-[#D4A843] dark:bg-[#3D2E0A] dark:text-[#D4A843]" },
  { value: 4, label: "Good",  description: "Recalled with effort",  colour: "border-[#3D7EAA] bg-[#D6E8F5] text-[#3D7EAA] dark:border-[#5B9EC9] dark:bg-[#1E3A52] dark:text-[#5B9EC9]" },
  { value: 5, label: "Easy",  description: "Recalled immediately",  colour: "border-[#4A8C6F] bg-[#D4EDE3] text-[#4A8C6F] dark:border-[#5FAD8A] dark:bg-[#1A3D2E] dark:text-[#5FAD8A]" },
];

export function ReviewModal({ open, problemTitle, reviewNumber, onClose, onSubmit }: Props) {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [timeTaken, setTimeTaken] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setQuality(null);
    setTimeTaken("");
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (!quality) return;
    setSubmitting(true);
    const mins = timeTaken !== "" ? parseInt(timeTaken, 10) : null;
    await onSubmit(quality, isNaN(mins as number) ? null : mins);
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm bg-[#F7F5F0] dark:bg-[#1A2230] border-[#D4CFC6] dark:border-[#2A3A4A]">
        <DialogHeader>
          <DialogTitle className="text-[#1C2B3A] dark:text-[#E8EDF2] text-base">
            Review #{reviewNumber}
          </DialogTitle>
          <p className="text-sm text-[#6B7F8E] truncate">{problemTitle}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7F8E] mb-2">How did it go?</p>
            <div className="grid grid-cols-2 gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setQuality(opt.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    quality === opt.value
                      ? opt.colour + " border-2"
                      : "border-[#D4CFC6] dark:border-[#2A3A4A] hover:border-[#6B7F8E] bg-[#EDEAE3] dark:bg-[#243040]"
                  }`}
                >
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs opacity-75 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6B7F8E] mb-2 block">
              Time taken (minutes) — optional
            </label>
            <input
              type="number"
              min="1"
              max="180"
              placeholder="e.g. 15"
              value={timeTaken}
              onChange={(e) => setTimeTaken(e.target.value)}
              className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-2 text-sm bg-[#EDEAE3] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!quality || submitting}
            className="w-full py-2 rounded text-sm font-semibold bg-[#3D7EAA] hover:bg-[#2E6A94] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Saving…" : "Complete Review"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
