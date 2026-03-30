"use client";

import { useEffect, useMemo, useState } from "react";

import type { Word } from "@/domain/types";
import { getWordRepository } from "@/data/word-repository";

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [referenceNow] = useState(() => Date.now());

  useEffect(() => {
    getWordRepository()
      .list()
      .then(setWords);
  }, []);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return [...words].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return words
      .filter((word) => `${word.text} ${word.meaning ?? ""}`.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [search, words]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">My Words</h1>

      {/* <div className="flex flex-wrap gap-3">
        <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold" href="/words/new">
          + Add Word
        </Link>
        <Link
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold"
          href="/quiz/run?mode=recent7d&count=10"
        >
          Quiz
        </Link>
      </div> */}

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Words..."
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        {filteredWords.length === 0 ? (
          <p className="text-sm text-zinc-600">No words yet.</p>
        ) : (
          <ul className="space-y-2">
            {filteredWords.map((word) => (
              <li key={word.id} className="rounded-md border border-zinc-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">{word.text}</p>
                  <p className="text-xs text-zinc-500">{word.tags[0] ?? "-"}</p>
                </div>
                <p className="text-sm text-zinc-700">{word.meaning ?? "No meaning yet"}</p>
                <p className="text-xs text-zinc-500">{formatAddedAt(word.createdAt, referenceNow)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function formatAddedAt(value: string, referenceNow: number): string {
  const createdMs = new Date(value).getTime();
  const diffMs = referenceNow - createdMs;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) {
    return "Today";
  }
  if (days === 1) {
    return "1 Day Ago";
  }
  return `${days} Days Ago`;
}
