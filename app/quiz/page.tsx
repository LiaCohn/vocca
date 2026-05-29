"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getListRepository, type ListWithWordCount } from "@/data/list-repository";
import type { QuizMode } from "@/domain/types";

const modeOptions: Array<{ value: QuizMode; label: string; description: string; emoji: string }> = [
  { value: "recent24h", label: "Recent 24h", description: "Words added in the last day.", emoji: "⚡" },
  { value: "recent7d", label: "Recent 7d", description: "Words added in the last week.", emoji: "📅" },
  { value: "random", label: "Random", description: "Any available word.", emoji: "🎲" },
  { value: "weak", label: "Weak words", description: "Prioritize words you miss most.", emoji: "💪" },
];

export default function QuizPage() {
  const router = useRouter();
  const [mode, setMode] = useState<QuizMode>("recent7d");
  const [count, setCount] = useState(10);
  const [lists, setLists] = useState<ListWithWordCount[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");

  useEffect(() => {
    getListRepository()
      .list()
      .then(setLists)
      .catch(() => setLists([]));
  }, []);

  function beginQuiz() {
    const params = new URLSearchParams({
      mode,
      count: String(count),
    });
    if (selectedListId) {
      params.set("listId", selectedListId);
    }
    router.push(`/quiz/run?${params.toString()}`);
  }

  return (
    <section className="space-y-4">
      <h1 className="vocca-page-title">Start quiz</h1>
      <div className="vocca-card space-y-4 p-4 sm:p-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-vocca-ink">Quiz mode</label>
          <div className="space-y-2">
            {modeOptions.map((option) => {
              const selected = mode === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-3 text-sm transition ${
                    selected
                      ? "border-vocca-primary bg-vocca-bg shadow-[var(--vocca-shadow-sm)]"
                      : "border-vocca-border bg-white hover:border-vocca-coral/40"
                  }`}
                >
                  <input
                    className="mt-1 accent-vocca-primary"
                    type="radio"
                    name="mode"
                    checked={selected}
                    onChange={() => setMode(option.value)}
                  />
                  <span className="text-lg" aria-hidden>
                    {option.emoji}
                  </span>
                  <span>
                    <span className="font-bold text-vocca-ink">{option.label}</span>
                    <span className="mt-0.5 block text-vocca-ink-muted">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-vocca-ink">Questions</label>
          <input
            type="number"
            min={3}
            max={30}
            value={count}
            onChange={(event) => setCount(Number(event.target.value || 10))}
            className="vocca-input w-28"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-vocca-ink">Word source</label>
          <select
            value={selectedListId}
            onChange={(event) => setSelectedListId(event.target.value)}
            className="vocca-input"
          >
            <option value="">All words</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.wordCount})
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="vocca-btn-primary w-full" onClick={beginQuiz}>
          Begin quiz
        </button>
      </div>
    </section>
  );
}
