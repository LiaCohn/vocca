"use client";

import { FormEvent, useEffect, useState } from "react";

import { WordComponent } from "@/components/Word";
import { getListRepository, type ListWithWordCount } from "@/data/list-repository";
import type { Word } from "@/domain/types";
import { getWordRepository } from "@/data/word-repository";

type ListItemProps = {
  item: ListWithWordCount;
  availableLists: ListWithWordCount[];
  nowMs: number;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onListWordCountChange: (listId: string, nextCount: number) => void;
};

function ListItem({
  item,
  availableLists,
  nowMs,
  onRename,
  onDelete,
  onListWordCountChange,
}: ListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(item.name);
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [listWords, setListWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [wordsError, setWordsError] = useState<string | null>(null);

  useEffect(() => {
    setNameDraft(item.name);
  }, [item.name]);

  async function toggleExpanded() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    setWordsError(null);

    if (item.wordCount === 0) {
      setListWords([]);
      return;
    }

    setLoadingWords(true);
    try {
      const words = await getListRepository().listWords(item.id);
      setListWords(words);
    } catch {
      setWordsError("Could not load words.");
      setListWords([]);
    } finally {
      setLoadingWords(false);
    }
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = nameDraft.trim();
    if (!nextName || nextName === item.name) {
      setIsEditing(false);
      setNameDraft(item.name);
      return;
    }

    setPending(true);
    try {
      await onRename(item.id, nextName);
      setIsEditing(false);
    } finally {
      setPending(false);
    }
  }

  function handleWordDelete(wordId: string) {
    return getWordRepository()
      .remove(wordId)
      .then(() => {
        setListWords((prev) => prev.filter((w) => w.id !== wordId));
        const nextCount = Math.max(0, item.wordCount - 1);
        onListWordCountChange(item.id, nextCount);
      });
  }

  return (
    <li className="rounded-md border border-zinc-200 bg-white overflow-hidden">
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        {!isEditing ? (
          <>
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <button
                type="button"
                onClick={toggleExpanded}
                aria-expanded={expanded}
                aria-label={expanded ? `Collapse words in ${item.name}` : `Show words in ${item.name}`}
                className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-200 p-1 text-zinc-600 hover:bg-zinc-50"
              >
                <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`size-5 transition-transform ${expanded ? "rotate-90" : ""}`}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={toggleExpanded}
                className="min-w-0 flex-1 text-left hover:underline"
              >
                <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                <p className="text-xs text-zinc-600">
                  {item.wordCount} {item.wordCount === 1 ? "word" : "words"}
                </p>
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsEditing(true);
                }}
                className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void onDelete(item.id);
                }}
                className="rounded-md border border-red-200 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleRename} className="flex w-full flex-1 flex-wrap items-center gap-2">
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className="min-w-[12rem] flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={pending || nameDraft.trim().length === 0}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setIsEditing(false);
                setNameDraft(item.name);
              }}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {expanded ? (
        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-3">
          {loadingWords ? (
            <p className="text-sm text-zinc-600">Loading words...</p>
          ) : wordsError ? (
            <p className="text-sm text-red-600">{wordsError}</p>
          ) : listWords.length === 0 ? (
            <p className="text-sm text-zinc-600">No words in this list yet.</p>
          ) : (
            <ul className="space-y-2">
              {listWords.map((word) => (
                <WordComponent
                  key={word.id}
                  word={word}
                  onDelete={(id) => void handleWordDelete(id)}
                  nowMs={nowMs}
                  availableLists={availableLists}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}

export default function ListsPage() {
  const [lists, setLists] = useState<ListWithWordCount[]>([]);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    getListRepository()
      .list()
      .then((items) => {
        setLists(items);
        setError(null);
      })
      .catch(() => setError("Could not load lists. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const created = await getListRepository().create(name);
      const createdWithCount: ListWithWordCount = { ...created, wordCount: 0 };
      setLists((prev) => [createdWithCount, ...prev]);
      setNewListName("");
      setError(null);
    } catch {
      setError("Could not create list. If the name already exists, pick another one.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id: string, name: string) {
    const updated = await getListRepository().rename(id, name);
    if (!updated) {
      setError("Could not rename list.");
      return;
    }

    setLists((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: updated.name, updatedAt: updated.updatedAt } : item)),
    );
    setError(null);
  }

  async function handleDelete(id: string) {
    try {
      await getListRepository().remove(id);
      setLists((prev) => prev.filter((item) => item.id !== id));
      setError(null);
    } catch {
      setError("Could not delete list.");
    }
  }

  function handleListWordCountChange(listId: string, nextCount: number) {
    setLists((prev) =>
      prev.map((item) => (item.id === listId ? { ...item, wordCount: nextCount } : item)),
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Lists</h1>

      <form onSubmit={handleCreate} className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <input
          value={newListName}
          onChange={(event) => setNewListName(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Add a new list (e.g. Business English)"
        />
        <button
          type="submit"
          disabled={creating || newListName.trim().length === 0}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {creating ? "Adding..." : "Add"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-zinc-600">Loading lists...</p>
      ) : error ? null : lists.length === 0 ? (
        <p className="text-sm text-zinc-600">No lists yet.</p>
      ) : (
        <ul className="space-y-2">
          {lists.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              availableLists={lists}
              nowMs={nowMs}
              onRename={handleRename}
              onDelete={handleDelete}
              onListWordCountChange={handleListWordCountChange}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
