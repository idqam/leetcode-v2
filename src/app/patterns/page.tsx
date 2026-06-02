"use client";

import { useEffect, useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, X, RefreshCw } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Lang = "py" | "js" | "java" | "go";
const LANG_LABELS: Record<Lang, string> = { py: "Python", js: "JavaScript", java: "Java", go: "Go" };
const LANG_PRISM: Record<Lang, string> = { py: "python", js: "javascript", java: "java", go: "go" };

interface Pattern {
  id: number; title: string; description: string;
  templatePy: string; templateJs: string; templateJava: string; templateGo: string;
  problemLinks: { problem: { id: string; title: string; difficulty: string } }[];
}

interface Problem { id: string; title: string; difficulty: string }

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

  const linkedIds = new Set(selected?.problemLinks.map((l) => l.problem.id) ?? []);
  const searchResults = allProblems.filter((p) => !linkedIds.has(p.id) && p.title.toLowerCase().includes(linkSearch.toLowerCase())).slice(0, 8);

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
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">{selected.title}</h1>
            <button onClick={() => deletePattern(selected.id)} className="text-[#6B7F8E] hover:text-[#B54A4A]">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-[#6B7F8E]">{selected.description}</p>

          <Tabs defaultValue="py">
            <TabsList className="bg-[#EDEAE3] dark:bg-[#1A2230]">
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <TabsTrigger key={l} value={l}>{LANG_LABELS[l]}</TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => {
              const key = `template${l.charAt(0).toUpperCase() + l.slice(1)}` as keyof Pattern;
              return (
                <TabsContent key={l} value={l}>
                  <SyntaxHighlighter language={LANG_PRISM[l]} style={oneDark} customStyle={{ borderRadius: 6, fontSize: 13 }}>
                    {(selected[key] as string) || `# No ${LANG_LABELS[l]} template yet`}
                  </SyntaxHighlighter>
                </TabsContent>
              );
            })}
          </Tabs>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-[#6B7F8E] mb-2">Linked Problems</h3>
            <div className="space-y-1 mb-3">
              {selected.problemLinks.map(({ problem }) => (
                <div key={problem.id} className="flex items-center justify-between text-sm px-3 py-1.5 bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded">
                  <span className="text-[#1C2B3A] dark:text-[#E8EDF2]">{problem.title}</span>
                  <button onClick={() => unlinkProblem(selected.id, problem.id)} className="text-[#6B7F8E] hover:text-[#B54A4A]"><X size={12} /></button>
                </div>
              ))}
            </div>
            <input
              placeholder="Search problems to link…"
              value={linkSearch}
              onChange={(e) => setLinkSearch(e.target.value)}
              className="w-full border border-[#D4CFC6] dark:border-[#2A3A4A] rounded px-3 py-1.5 text-sm bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2] mb-1"
            />
            {linkSearch && searchResults.map((p) => (
              <button key={p.id} onClick={() => { linkProblem(selected.id, p.id); setLinkSearch(""); }}
                className="w-full text-left text-sm px-3 py-1.5 hover:bg-[#EDEAE3] dark:hover:bg-[#1A2230] rounded text-[#1C2B3A] dark:text-[#E8EDF2]">
                {p.title}
              </button>
            ))}
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
