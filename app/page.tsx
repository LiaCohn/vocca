"use client";

import { useEffect, useMemo, useState } from "react";

import type { Word } from "@/domain/types";
import { getWordRepository } from "@/data/word-repository";
import { WordComponent } from "@/components/Word";

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  // const [referenceNow] = useState(() => Date.now());

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

  const handleDelete = (id: string) => {
    getWordRepository().remove(id).then(() => {
      setWords(words.filter((word) => word.id !== id));
    });
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">My Words</h1>


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
            {filteredWords.map((word) => WordComponent({word, onDelete: handleDelete}))}
          </ul>
        )}
      </section>
    </section>
  );
}

