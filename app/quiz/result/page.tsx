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
        <h1 className="vocca-page-title">No recent quiz</h1>
        <p className="text-sm text-vocca-ink-muted">Start a new quiz first.</p>
        <Link className="vocca-btn-secondary inline-block" href="/quiz">
          Go to quiz
        </Link>
      </section>
    );
  }

  const misses = summary.results.filter((result) => !result.isCorrect);
  const pct = summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0;

  return (
    <section className="space-y-4">
      <h1 className="vocca-page-title">Your score</h1>
      <div className="vocca-card p-5 sm:p-6">
        <div className="text-center">
          <p className="font-display text-6xl font-semibold text-vocca-primary sm:text-7xl">{pct}%</p>
          <p className="mt-1 text-sm font-bold text-vocca-ink-muted">
            {summary.correct} / {summary.total} correct
          </p>
        </div>

        <h2 className="mt-8 font-display text-xl font-semibold text-vocca-ink">Mistakes</h2>
        {misses.length === 0 ? (
          <p className="mt-2 text-sm font-medium text-vocca-mint">Perfect run — amazing!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {misses.map((miss, index) => (
              <li
                key={`${miss.wordId}-${index}`}
                className="rounded-xl border-2 border-vocca-coral/30 bg-rose-50/50 px-3 py-2.5"
              >
                <span className="font-display font-semibold text-vocca-ink">
                  {wordNames[miss.wordId] ?? "word"}
                </span>
                <span className="text-vocca-ink-muted"> → </span>
                <span className="text-sm font-medium text-vocca-ink">{miss.correctAnswer}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <RetryMistakesButton misses={misses} />
          <Link className="vocca-btn-secondary text-center" href="/">
            Back to home
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
      className="vocca-btn-primary w-full sm:w-auto"
    >
      Retry mistakes
    </button>
  );
}
