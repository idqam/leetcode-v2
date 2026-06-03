"use client";

import { useEffect, useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Plus, X, RefreshCw, Copy, Check, Search, Pencil, CornerDownLeft } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Lang = "py" | "js" | "java" | "go";
const LANG_LABELS: Record<Lang, string> = { py: "Python", js: "JavaScript", java: "Java", go: "Go" };
const LANG_PRISM: Record<Lang, string> = { py: "python", js: "javascript", java: "java", go: "go" };
const LANGS: Lang[] = ["py", "js", "java", "go"];
const tmplKey = (l: Lang) => `template${l[0].toUpperCase()}${l.slice(1)}` as keyof Pattern;

const DIFF_DOT: Record<string, string> = { Easy: "#4A8C6F", Medium: "#B8922A", Hard: "#B54A4A" };

// Lightweight fuzzy subsequence matcher: returns a score + the matched character
// indices (for bolding), or null when not every query char appears in order.
function fuzzy(query: string, text: string): { score: number; indices: number[] } | null {
  const q = query.toLowerCase().trim();
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  let qi = 0, score = 0, prev = -2;
  const indices: number[] = [];
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      let bonus = 1;
      if (ti === 0) bonus += 5;                       // start of string
      else if (/[^a-z0-9]/.test(t[ti - 1])) bonus += 3; // right after a separator
      if (ti === prev + 1) bonus += 4;                // consecutive run
      score += bonus;
      indices.push(ti);
      prev = ti;
      qi++;
    }
  }
  if (qi < q.length) return null;
  score -= (t.length - indices.length) * 0.05;        // prefer tighter matches
  return { score, indices };
}

function highlight(text: string, indices: number[]) {
  const set = new Set(indices);
  return Array.from(text).map((ch, i) =>
    set.has(i)
      ? <b key={i} className="font-extrabold text-[#1C2B3A] dark:text-[#E8EDF2]">{ch}</b>
      : <span key={i}>{ch}</span>
  );
}

interface Pattern {
  id: number; title: string; description: string;
  templatePy: string; templateJs: string; templateJava: string; templateGo: string;
  problemLinks: { problem: { id: string; title: string; difficulty: string } }[];
}

interface Problem { id: string; title: string; difficulty: string; listName: string }

export default function PatternsPage() {
  const CACHE_KEY = "patterns.data";
  const TIMESTAMP_KEY = "patterns.timestamp";
  const PROBLEMS_CACHE_KEY = "patterns.problems";
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selected, setSelected] = useState<Pattern | null>(null);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPattern, setNewPattern] = useState({ title: "", description: "", templatePy: "", templateJs: "", templateJava: "", templateGo: "" });
  const [linkSearch, setLinkSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useLocalStorage<number>(TIMESTAMP_KEY, 0);
  const [isLoading, setIsLoading] = useState(false);

  // Template panel + command-palette state
  const [activeLang, setActiveLang] = useState<Lang>("py");
  const [activeIdx, setActiveIdx] = useState(0);
  const [editingLang, setEditingLang] = useState<Lang | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const loadPatterns = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cacheTime = lastUpdated;
      const now = Date.now();

      if (!force && cached && now - cacheTime < CACHE_DURATION_MS) {
        try {
          const data = JSON.parse(cached);
          setPatterns(data);
          setIsLoading(false);
          return;
        } catch {
          // Invalid cache
        }
      }

      const res = await fetch("/api/patterns");
      const data: Pattern[] = await res.json();
      setPatterns(data);
      if (selected) setSelected(data.find((p) => p.id === selected.id) ?? null);

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setLastUpdated(now);
      } catch {
        // Quota exceeded
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastUpdated, setLastUpdated, selected]);

  const loadProblems = useCallback(async (force = false) => {
    try {
      const cached = localStorage.getItem(PROBLEMS_CACHE_KEY);
      const cacheTime = lastUpdated;
      const now = Date.now();

      if (!force && cached && now - cacheTime < CACHE_DURATION_MS) {
        try {
          setAllProblems(JSON.parse(cached));
          return;
        } catch {
          // Invalid cache
        }
      }

      const listsRes = await fetch("/api/problems/lists");
      if (!listsRes.ok) return;
      const lists: string[] = await listsRes.json();
      const results = await Promise.all(
        lists.map((l) => fetch(`/api/problems?list=${encodeURIComponent(l)}`).then((r) => r.json()))
      );
      const all: Problem[] = results.flat();
      const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());
      setAllProblems(unique);

      try {
        localStorage.setItem(PROBLEMS_CACHE_KEY, JSON.stringify(unique));
      } catch {
        // Quota exceeded
      }
    } catch (err) {
      console.error("Failed to load problems:", err);
    }
  }, [lastUpdated, setLastUpdated]);

  const formatLastUpdated = () => {
    if (!lastUpdated) return "Never";
    const diff = Date.now() - lastUpdated;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  useEffect(() => {
    loadPatterns();
    loadProblems();
  }, [loadPatterns, loadProblems]);

  // Reset the per-pattern UI whenever the selected pattern changes, so the link
  // search never carries over between patterns and the language tab lands on a
  // template that actually exists.
  useEffect(() => {
    setLinkSearch("");
    setActiveIdx(0);
    setEditingLang(null);
    if (selected) {
      const firstFilled = LANGS.find((l) => selected[tmplKey(l)] as string);
      setActiveLang(firstFilled ?? "py");
    }
    // Only re-run when the selected pattern id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function addPattern() {
    if (!newPattern.title.trim()) return;
    await fetch("/api/patterns", { method: "POST", body: JSON.stringify(newPattern), headers: { "Content-Type": "application/json" } });
    setNewPattern({ title: "", description: "", templatePy: "", templateJs: "", templateJava: "", templateGo: "" });
    setShowAdd(false);
    await loadPatterns(true);
  }

  async function linkProblem(patternId: number, problemId: string) {
    await fetch(`/api/patterns/${patternId}/problems`, { method: "POST", body: JSON.stringify({ problemIds: [problemId] }), headers: { "Content-Type": "application/json" } });
    await loadPatterns(true);
  }

  async function unlinkProblem(patternId: number, problemId: string) {
    await fetch(`/api/patterns/${patternId}/problems`, { method: "DELETE", body: JSON.stringify({ problemId }), headers: { "Content-Type": "application/json" } });
    await loadPatterns(true);
  }

  async function deletePattern(id: number) {
    await fetch(`/api/patterns/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    await loadPatterns(true);
  }

  async function saveTemplate() {
    if (!selected || !editingLang) return;
    await fetch(`/api/patterns/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [tmplKey(editingLang)]: draft }),
    });
    setEditingLang(null);
    await loadPatterns(true);
  }

  async function copyTemplate(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable
    }
  }

  function doLink(id: string) {
    if (!selected) return;
    linkProblem(selected.id, id);
    setLinkSearch("");
    setActiveIdx(0);
  }

  const linkedIds = new Set(selected?.problemLinks.map((l) => l.problem.id) ?? []);

  // Fuzzy-ranked link candidates (top 8). Linked problems stay in the list but
  // are shown dimmed and are skipped by keyboard navigation.
  const results = linkSearch.trim()
    ? allProblems
        .map((p) => ({ p, m: fuzzy(linkSearch, p.title) }))
        .filter((r): r is { p: Problem; m: { score: number; indices: number[] } } => r.m !== null)
        .sort((a, b) => b.m.score - a.m.score)
        .slice(0, 8)
        .map((r) => ({ p: r.p, indices: r.m.indices }))
    : [];

  function moveActive(dir: 1 | -1) {
    if (!results.length) return;
    let i = activeIdx;
    for (let s = 0; s < results.length; s++) {
      i = (i + dir + results.length) % results.length;
      if (!linkedIds.has(results[i].p.id)) { setActiveIdx(i); return; }
    }
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const cur = results[activeIdx];
      const target = cur && !linkedIds.has(cur.p.id) ? cur : results.find((x) => !linkedIds.has(x.p.id));
      if (target) doLink(target.p.id);
    } else if (e.key === "Escape") {
      setLinkSearch("");
    }
  }

  const code = selected ? ((selected[tmplKey(activeLang)] as string) || "") : "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">Patterns</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B7F8E]">Updated: {formatLastUpdated()}</span>
          <button
            onClick={() => loadPatterns(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium border border-[#D4CFC6] dark:border-[#2A3A4A] text-[#6B7F8E] hover:text-[#3D7EAA] hover:border-[#3D7EAA] disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left: pattern list */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}
          className="w-full justify-start gap-2 bg-[#3D7EAA] hover:bg-[#2E6A94] text-white">
          <Plus size={14} /> Add Pattern
        </Button>

        {showAdd && (
          <div className="border border-[#D4CFC6] dark:border-[#2A3A4A] bg-[#EDEAE3] dark:bg-[#1A2230] rounded p-3 space-y-2 text-sm">
            <input placeholder="Title" value={newPattern.title} onChange={(e) => setNewPattern({ ...newPattern, title: e.target.value })}
              className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-2 py-1 bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]" />
            <textarea placeholder="Description" value={newPattern.description} onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
              className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-2 py-1 h-20 bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2]" />
            <Button size="sm" className="w-full bg-[#3D7EAA] hover:bg-[#2E6A94] text-white" onClick={addPattern}>Create</Button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 space-y-1">
          {patterns.length === 0 && (
            <p className="text-xs text-[#6B7F8E] px-2 py-3">No patterns yet. Create one above.</p>
          )}
          {patterns.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)}
              className={`w-full text-left text-sm px-3 py-2 rounded transition-colors ${
                selected?.id === p.id
                  ? "bg-[#3D7EAA] text-white"
                  : "hover:bg-[#EDEAE3] dark:hover:bg-[#1A2230] text-[#1C2B3A] dark:text-[#E8EDF2]"
              }`}>
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Right: detail */}
      {selected ? (
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">{selected.title}</h1>
            <button onClick={() => deletePattern(selected.id)} className="text-[#6B7F8E] hover:text-[#B54A4A]">
              <X size={16} />
            </button>
          </div>
          {selected.description && <p className="text-sm text-[#6B7F8E]">{selected.description}</p>}

          {/* Template + language — segmented tabs flush on top of a full-width code card */}
          <div className="rounded-lg border border-[#D4CFC6] dark:border-[#2A3A4A] overflow-hidden">
            <div className="flex items-center gap-1 bg-[#EDEAE3] dark:bg-[#1A2230] p-1.5 border-b border-[#D4CFC6] dark:border-[#2A3A4A]">
              {LANGS.map((l) => {
                const filled = !!(selected[tmplKey(l)] as string);
                const active = activeLang === l;
                return (
                  <button key={l} onClick={() => { setActiveLang(l); setEditingLang(null); }}
                    className={`text-[13px] font-semibold px-3.5 py-1.5 rounded-md transition-colors ${
                      active
                        ? "bg-white dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2] shadow-sm"
                        : "text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2]"
                    }`}>
                    {LANG_LABELS[l]}
                    {filled && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3D7EAA] ml-1.5 align-middle opacity-60" />}
                  </button>
                );
              })}
              <span className="flex-1" />
              {code && editingLang !== activeLang && (
                <>
                  <button onClick={() => { setEditingLang(activeLang); setDraft(code); }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7F8E] hover:text-[#3D7EAA] px-2 py-1 rounded transition-colors">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => copyTemplate(code)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7F8E] hover:text-[#3D7EAA] px-2 py-1 rounded transition-colors">
                    {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}
                  </button>
                </>
              )}
            </div>

            {editingLang === activeLang ? (
              <div className="bg-[#282c34] p-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  spellCheck={false}
                  autoFocus
                  placeholder={`# ${LANG_LABELS[activeLang]} template…`}
                  className="w-full h-48 bg-transparent text-[#abb2bf] font-mono text-[13px] leading-relaxed outline-none resize-y placeholder:text-[#5c6370]"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setEditingLang(null)}
                    className="text-xs font-semibold px-3 py-1.5 rounded text-[#abb2bf] hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveTemplate}
                    className="text-xs font-semibold px-3 py-1.5 rounded bg-[#3D7EAA] hover:bg-[#2E6A94] text-white transition-colors">
                    Save
                  </button>
                </div>
              </div>
            ) : code ? (
              <SyntaxHighlighter language={LANG_PRISM[activeLang]} style={oneDark} customStyle={{ margin: 0, borderRadius: 0, fontSize: 13 }}>
                {code}
              </SyntaxHighlighter>
            ) : (
              <div className="bg-[#282c34] text-center py-10 px-4">
                <p className="text-[#5c6370] font-mono text-sm">No {LANG_LABELS[activeLang]} template yet</p>
                <button onClick={() => { setEditingLang(activeLang); setDraft(""); }}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-white bg-[#3D7EAA] hover:bg-[#2E6A94] px-3.5 py-2 rounded-md transition-colors">
                  <Plus size={14} /> Add {LANG_LABELS[activeLang]} template
                </button>
              </div>
            )}
          </div>

          {/* Linked problems + command-palette search */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-[#6B7F8E] mb-2">Linked Problems</h3>
            <div className="space-y-1 mb-3">
              {selected.problemLinks.length === 0 && (
                <p className="text-xs text-[#6B7F8E]">No problems linked yet.</p>
              )}
              {selected.problemLinks.map(({ problem }) => (
                <div key={problem.id} className="flex items-center justify-between gap-2 text-sm px-3 py-1.5 bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded">
                  <span className="flex items-center gap-2 text-[#1C2B3A] dark:text-[#E8EDF2]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DIFF_DOT[problem.difficulty] ?? "#6B7F8E" }} />
                    {problem.title}
                  </span>
                  <button onClick={() => unlinkProblem(selected.id, problem.id)} className="text-[#6B7F8E] hover:text-[#B54A4A]"><X size={12} /></button>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-lg px-3 py-2 bg-[#F7F5F0] dark:bg-[#243040] focus-within:border-[#3D7EAA] focus-within:ring-2 focus-within:ring-[#3D7EAA]/15 transition-colors">
                <Search size={15} className="text-[#6B7F8E] flex-shrink-0" />
                <input
                  value={linkSearch}
                  onChange={(e) => { setLinkSearch(e.target.value); setActiveIdx(0); }}
                  onKeyDown={onSearchKey}
                  placeholder="Search problems to link…"
                  className="flex-1 bg-transparent outline-none text-sm text-[#1C2B3A] dark:text-[#E8EDF2] placeholder:text-[#6B7F8E]"
                />
                {linkSearch && (
                  <button onClick={() => setLinkSearch("")} className="text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2]"><X size={13} /></button>
                )}
              </div>

              {linkSearch && (
                <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white dark:bg-[#243040] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-xl shadow-[0_12px_40px_-12px_rgba(28,43,58,0.28)] overflow-hidden">
                  {results.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#6B7F8E]">No matches for “{linkSearch}”.</div>
                  ) : (
                    <ul className="p-1.5">
                      {results.map(({ p, indices }, i) => {
                        const linked = linkedIds.has(p.id);
                        const active = i === activeIdx && !linked;
                        return (
                          <li key={p.id}
                            onMouseEnter={() => { if (!linked) setActiveIdx(i); }}
                            onClick={() => { if (!linked) doLink(p.id); }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${linked ? "opacity-50 cursor-default" : "cursor-pointer"} ${active ? "bg-[#3D7EAA]/10" : ""}`}>
                            <span className="w-2 text-[#3D7EAA] flex-shrink-0">{active ? "▸" : ""}</span>
                            <span className={`flex-1 ${linked ? "text-[#6B7F8E]" : "text-[#1C2B3A] dark:text-[#E8EDF2]"}`}>{highlight(p.title, indices)}</span>
                            <span className="flex items-center gap-2 text-xs text-[#6B7F8E] flex-shrink-0">
                              <span className="w-2 h-2 rounded-full" style={{ background: DIFF_DOT[p.difficulty] ?? "#6B7F8E" }} />
                              {p.difficulty} · {linked ? "linked" : p.listName}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-[#6B7F8E] px-3 py-2 border-t border-[#D4CFC6] dark:border-[#2A3A4A] bg-[#EDEAE3] dark:bg-[#1A2230]">
                    <span className="inline-flex items-center gap-1"><CornerDownLeft size={11} /> link</span>
                    <span>↑↓ move</span>
                    <span>esc close</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#6B7F8E] text-sm">
          Select a pattern or create one.
        </div>
      )}
      </div>
    </div>
  );
}
