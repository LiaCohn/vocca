"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getWordRepository } from "@/data/word-repository";
import type { QuizMode, QuizResult } from "@/domain/types";

const SUMMARY_STORAGE_KEY = "vocca.last-quiz-summary.v1";

type Summary = {
  mode: QuizMode;
  total: number;
  correct: number;
  results: QuizResult[];
};

function readSummary(): Summary | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SUMMARY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Summary;
  } catch {
    return null;
  }
}

export default function QuizResultPage() {
  const summary = useMemo(() => readSummary(), []);
  const [wordNames, setWordNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void getWordRepository().list().then((words) => {
      const map: Record<string, string> = {};
      for (const word of words) {
        map[word.id] = word.text;
      }
      setWordNames(map);
    });
  }, []);

  if (!summary) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">No recent quiz</h1>
        <p className="text-sm text-zinc-600">Start a new quiz first.</p>
        <Link className="inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm" href="/quiz">
          Go to quiz
        </Link>
      </section>
    );
  }

  const misses = summary.results.filter((result) => !result.isCorrect);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Result Screen</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-8">
        <p className="text-5xl font-semibold">
          Score: {summary.correct} / {summary.total}
        </p>

        <h2 className="mt-8 text-5xl font-semibold">Mistakes:</h2>
        {misses.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">Perfect run.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-4xl">
            {misses.map((miss, index) => (
              <li key={`${miss.wordId}-${index}`} className="rounded-md border border-zinc-200 px-3 py-2">
                - {wordNames[miss.wordId] ?? "word"} -&gt; {miss.correctAnswer}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
        <RetryMistakesButton misses={misses} />
        <Link className="rounded-md border border-zinc-300 px-4 py-2 text-sm" href="/">
          Back to Home
        </Link>
      </div>
      </div>
    </section>
  );
}

function RetryMistakesButton({ misses }: { misses: QuizResult[] }) {
  if (misses.length === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={async () => {
        const repository = getWordRepository();
        const allWords = await repository.list();
        const retryWords = allWords.filter((word) => misses.some((miss) => miss.wordId === word.id));

        window.sessionStorage.setItem("vocca.retry-ids.v1", JSON.stringify(retryWords.map((word) => word.id)));
        window.location.href = "/quiz/run?mode=random&count=" + retryWords.length;
      }}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
    >
      Retry mistakes
    </button>
  );
}
