"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { QuizMode } from "@/domain/types";

const modeOptions: Array<{ value: QuizMode; label: string; description: string }> = [
  { value: "recent24h", label: "Recent 24h", description: "Words added in the last day." },
  { value: "recent7d", label: "Recent 7d", description: "Words added in the last week." },
  { value: "random", label: "Random", description: "Any available word." },
  { value: "weak", label: "Weak words", description: "Prioritize words with higher mistake rate." },
];

export default function QuizPage() {
  const router = useRouter();
  const [mode, setMode] = useState<QuizMode>("recent7d");
  const [count, setCount] = useState(10);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Start quiz</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium">Quiz mode</label>
        <div className="space-y-2">
          {modeOptions.map((option) => (
            <label key={option.value} className="block rounded-md border border-zinc-200 px-3 py-2 text-sm">
              <input
                className="mr-2"
                type="radio"
                name="mode"
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
              />
              <span className="font-medium">{option.label}</span>
              <span className="ml-2 text-zinc-600">{option.description}</span>
            </label>
          ))}
        </div>

        <label className="mb-1 mt-4 block text-sm font-medium">Questions</label>
        <input
          type="number"
          min={3}
          max={30}
          value={count}
          onChange={(event) => setCount(Number(event.target.value || 10))}
          className="w-32 rounded-md border border-zinc-300 px-3 py-2"
        />

        <button
          type="button"
          className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => router.push(`/quiz/run?mode=${mode}&count=${count}`)}
        >
          Begin quiz
        </button>
      </div>
    </section>
  );
}
