"use client";

import { useEffect, useMemo, useState } from "react";

import { WordComponent } from "@/components/Word";
import type { ListWithWordCount } from "@/data/list-repository";
import { getWordRepository } from "@/data/word-repository";
import type { Word } from "@/domain/types";

type HomeClientProps = {
  initialWords: Word[];
  initialLists: ListWithWordCount[];
};

export function HomeClient({ initialWords, initialLists }: HomeClientProps) {
  const [words, setWords] = useState(initialWords);
  const [lists] = useState(initialLists);
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 60 * 1000);

    return () => clearInterval(interval);
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

  const handleDelete = (id: string) => {
    getWordRepository().remove(id).then(() => {
      setWords(words.filter((word) => word.id !== id));
    });
  };

  return (
    <section className="space-y-4">
      <h1 className="vocca-page-title">My Words</h1>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search words..."
        className="vocca-input"
      />

      {filteredWords.length === 0 ? (
        <div className="vocca-card p-6 text-center">
          <p className="font-display text-lg text-vocca-ink-muted">No words yet</p>
          <p className="mt-1 text-sm text-vocca-ink-muted">Tap Add to grow your collection!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredWords.map((word) => (
            <WordComponent
              key={word.id}
              word={word}
              onDelete={handleDelete}
              nowMs={nowMs}
              availableLists={lists}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
