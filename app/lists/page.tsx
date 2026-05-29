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
    <li className="vocca-card overflow-hidden border-l-4 border-l-vocca-sky">
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        {!isEditing ? (
          <>
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <button
                type="button"
                onClick={toggleExpanded}
                aria-expanded={expanded}
                aria-label={expanded ? `Collapse words in ${item.name}` : `Show words in ${item.name}`}
                className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-vocca-border p-1 text-vocca-primary hover:bg-vocca-bg"
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
                <p className="truncate font-display text-base font-semibold text-vocca-ink">{item.name}</p>
                <p className="text-xs font-medium text-vocca-ink-muted">
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
                className="vocca-btn-secondary px-2 py-1 text-xs"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void onDelete(item.id);
                }}
                className="rounded-xl border-2 border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
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
              className="vocca-input min-w-[12rem] flex-1 py-1.5 text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={pending || nameDraft.trim().length === 0}
              className="vocca-btn-primary px-2 py-1 text-xs disabled:opacity-50"
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
              className="vocca-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {expanded ? (
        <div className="border-t-2 border-vocca-border bg-vocca-bg/50 px-3 py-3">
          {loadingWords ? (
            <p className="text-sm text-vocca-ink-muted">Loading words...</p>
          ) : wordsError ? (
            <p className="text-sm text-red-600">{wordsError}</p>
          ) : listWords.length === 0 ? (
            <p className="text-sm text-vocca-ink-muted">No words in this list yet.</p>
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
      <h1 className="vocca-page-title">Lists</h1>

      <form onSubmit={handleCreate} className="vocca-card flex flex-col gap-2 p-3 sm:flex-row">
        <input
          value={newListName}
          onChange={(event) => setNewListName(event.target.value)}
          className="vocca-input flex-1"
          placeholder="New list (e.g. Business English)"
        />
        <button
          type="submit"
          disabled={creating || newListName.trim().length === 0}
          className="vocca-btn-primary shrink-0 px-4 disabled:opacity-50"
        >
          {creating ? "Adding..." : "Add"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-vocca-ink-muted">Loading lists...</p>
      ) : error ? null : lists.length === 0 ? (
        <p className="text-sm text-vocca-ink-muted">No lists yet — create your first one above!</p>
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
